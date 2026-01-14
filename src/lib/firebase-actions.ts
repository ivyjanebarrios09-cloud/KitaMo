

import { addDoc, collection, serverTimestamp, writeBatch, doc, getDocs, query, where, updateDoc, deleteDoc, runTransaction, increment, arrayUnion, getDoc, collectionGroup, arrayRemove } from "firebase/firestore";
import { db } from "./firebase";
import { customAlphabet } from 'nanoid';
import { sendNotification } from "@/ai/flows/send-notification-flow";

// Generate a unique 6-character alphanumeric code
const nanoid = customAlphabet('1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ', 6);

export const createRoom = async (createdBy: string, createdByName: string, data: { name: string, description?: string }) => {
    try {
        const roomCode = nanoid();
        const roomRef = doc(collection(db, "rooms")); // Create a reference first
        const userRef = doc(db, 'users', createdBy);
        const userJoinedRoomRef = doc(db, 'users', createdBy, 'joinedRooms', roomRef.id);


        await runTransaction(db, async (transaction) => {
            // 1. Create the new room with the creator in the members list
            const roomPayload = {
                ...data,
                createdBy,
                createdByName,
                code: roomCode,
                createdAt: serverTimestamp(),
                members: [createdBy], // Creator is the first member
                totalCollected: 0,
                totalExpenses: 0,
                archived: false,
            };
            transaction.set(roomRef, roomPayload);

            // 2. Add the new room's ID to the creator's user document
            transaction.update(userRef, {
                rooms: arrayUnion(roomRef.id)
            });

            // 3. Add metadata to the creator's joinedRooms subcollection
            transaction.set(userJoinedRoomRef, {
                roomName: data.name,
                roomDescription: data.description || '',
                chairpersonId: createdBy,
                chairpersonName: createdByName,
                code: roomCode,
                joinedAt: serverTimestamp(),
            });
        });

    } catch (error) {
        console.error("Error creating room: ", error);
        throw new Error("Could not create room.");
    }
}

export const updateRoom = async (roomId: string, data: { name: string, description?: string }) => {
    try {
        const batch = writeBatch(db);
        const roomRef = doc(db, 'rooms', roomId);

        // Update the main room document
        batch.update(roomRef, data);

        // Get all members to update their joinedRooms subcollection
        const roomDoc = await getDoc(roomRef);
        const members = roomDoc.data()?.members || [];
        
        for (const memberId of members) {
            const joinedRoomRef = doc(db, 'users', memberId, 'joinedRooms', roomId);
            batch.update(joinedRoomRef, {
                roomName: data.name,
                roomDescription: data.description || ''
            });
        }
        
        await batch.commit();

    } catch (error) {
        console.error("Error updating room: ", error);
        throw new Error("Could not update room.");
    }
}

export const deleteRoom = async (roomId: string) => {
    try {
        const batch = writeBatch(db);

        const roomRef = doc(db, 'rooms', roomId);
        const roomDoc = await getDoc(roomRef);
        if (!roomDoc.exists()) throw new Error("Room not found");
        
        const members = roomDoc.data().members || [];

        // Delete all subcollections
        const subcollections = ['transactions', 'students'];
        for (const sub of subcollections) {
            const subcollectionRef = collection(db, 'rooms', roomId, sub);
            const snapshot = await getDocs(subcollectionRef);
            snapshot.forEach(doc => batch.delete(doc.ref));
        }

        // Delete the room itself
        batch.delete(roomRef);

        // Remove room from each member's user document and joinedRooms subcollection
        for (const memberId of members) {
            const userRef = doc(db, 'users', memberId);
            batch.update(userRef, {
                rooms: arrayRemove(roomId)
            });
            const joinedRoomRef = doc(db, 'users', memberId, 'joinedRooms', roomId);
            batch.delete(joinedRoomRef);
        }

        await batch.commit();

    } catch (error) {
        console.error("Error deleting room: ", error);
        throw new Error("Could not delete room.");
    }
}

export const addExpense = async (roomId: string, userId: string, userName: string, data: { description: string, amount: number, recipient: string, date: Date }) => {
    const roomRef = doc(db, 'rooms', roomId);
    let roomMembers: string[] = [];
    let roomName: string = '';
    
    try {
        await runTransaction(db, async (transaction) => {
            const roomDoc = await transaction.get(roomRef);
            if (!roomDoc.exists()) {
              throw 'Room not found';
            }
            roomMembers = roomDoc.data().members || [];
            roomName = roomDoc.data().name || '';

            // Add to general transactions log
            const transactionRef = doc(collection(db, 'rooms', roomId, 'transactions'));
            transaction.set(transactionRef, {
                roomId: roomId,
                userId: userId,
                userName: userName,
                amount: data.amount,
                type: 'debit',
                description: data.description,
                recipient: data.recipient,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                seenBy: [userId],
            });

            // Update total expenses in the room document
            transaction.update(roomRef, {
                totalExpenses: increment(data.amount)
            });
        });

        // Send notification after transaction is successful
        if (roomMembers.length > 0) {
            await sendNotification({
                title: `New Expense in ${roomName}`,
                message: `${data.description} - ₱${data.amount.toFixed(2)}`,
                userIds: roomMembers,
                url: `/dashboard/rooms/${roomId}/announcement`,
            });
        }

    } catch (error) {
        console.error("Error adding expense: ", error);
        throw new Error("Could not add expense.");
    }
}

export const addDeadline = async (roomId: string, userId: string, userName: string, data: { description: string, amount: number, dueDate: Date }) => {
  const roomRef = doc(db, 'rooms', roomId);
  
  await runTransaction(db, async (transaction) => {
    const roomDoc = await transaction.get(roomRef);
    if (!roomDoc.exists()) {
      throw new Error('Room does not exist!');
    }
    const members = roomDoc.data().members || [];
    const createdBy = roomDoc.data().createdBy;
    const roomName = roomDoc.data().name || '';

    // 1. Add deadline transaction
    const transactionRef = doc(collection(db, 'rooms', roomId, 'transactions'));
    transaction.set(transactionRef, {
        roomId: roomId,
        userId: userId, // who created it
        userName: userName,
        amount: data.amount,
        type: 'deadline',
        description: data.description,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        dueDate: data.dueDate,
        seenBy: [userId],
    });

    // 2. Update totalOwed and balance for all members in the room (in the /students subcollection)
    for (const memberId of members) {
      if (memberId !== createdBy) { 
        const studentToUpdateRef = doc(db, 'rooms', roomId, 'students', memberId);
        transaction.update(studentToUpdateRef, {
          totalOwed: increment(data.amount),
          balance: increment(data.amount)
        });
      }
    }
    // Send notification
    if (members.length > 0) {
        await sendNotification({
            title: `New Deadline in ${roomName}`,
            message: `${data.description} - ₱${data.amount.toFixed(2)}`,
            userIds: members,
            url: `/dashboard/rooms/${roomId}/announcement`,
        });
    }

  }).catch((error) => {
      console.error("Error adding deadline: ", error);
      throw new Error("Could not add deadline.");
  });
};
  
export const markTransactionAsSeen = async (roomId: string, transactionId: string, userId: string) => {
    try {
        const transactionRef = doc(db, 'rooms', roomId, 'transactions', transactionId);
        await updateDoc(transactionRef, {
            seenBy: arrayUnion(userId)
        });
    } catch (error) {
        console.error("Error marking transaction as seen: ", error);
        // We don't throw an error here to prevent crashing the app for the user
    }
};

export const joinRoom = async (roomCode: string, userId: string, userName: string, userEmail: string) => {
    const roomsRef = collection(db, 'rooms');
    const q = query(roomsRef, where("code", "==", roomCode));
    
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        throw new Error("No room found with that code.");
    }

    const roomDoc = querySnapshot.docs[0];
    const roomId = roomDoc.id;
    const roomData = roomDoc.data();
    const roomRef = doc(db, 'rooms', roomId);
    const userRef = doc(db, 'users', userId);
    const userJoinedRoomRef = doc(db, 'users', userId, 'joinedRooms', roomId);

    if (roomData.createdBy === userId) {
        throw new Error("You are the creator of this room and cannot join as a student.");
    }

    if (roomData.archived) {
        throw new Error("This room is archived and cannot be joined.");
    }

    // This must be done outside the transaction
    const deadlinesRef = collection(db, 'rooms', roomId, 'transactions');
    const deadlinesQuery = query(deadlinesRef, where('type', '==', 'deadline'));
    const deadlinesSnapshot = await getDocs(deadlinesQuery);
    let initialOwed = 0;
    deadlinesSnapshot.forEach(doc => {
        initialOwed += doc.data().amount;
    });

    await runTransaction(db, async (transaction) => {
        const roomTransactionDoc = await transaction.get(roomRef);
        if (!roomTransactionDoc.exists()) {
            throw new Error("Room not found during transaction.");
        }
        
        const members = roomTransactionDoc.data()?.members || [];
        if (members.includes(userId)) {
            throw new Error("You are already a member of this room.");
        }

        // 1. Add user to room's members list
        transaction.update(roomRef, {
            members: arrayUnion(userId)
        });

        // 2. Add room to user's rooms list
        transaction.update(userRef, {
            rooms: arrayUnion(roomId)
        })

        // 3. Create the student-specific details doc in the room's students subcollection
        const studentRef = doc(db, 'rooms', roomId, 'students', userId);
        transaction.set(studentRef, {
            totalPaid: 0,
            totalOwed: initialOwed,
            balance: initialOwed,
            lastPaymentAt: null,
        });

        // 4. Add metadata to the user's joinedRooms subcollection
        transaction.set(userJoinedRoomRef, {
            roomName: roomData.name,
            roomDescription: roomData.description || '',
            chairpersonId: roomData.createdBy,
            chairpersonName: roomData.createdByName,
            joinedAt: serverTimestamp(),
        });
    });
};

export const leaveRoom = async (roomId: string, userId: string) => {
    const roomRef = doc(db, 'rooms', roomId);
    const userRef = doc(db, 'users', userId);
    const studentRef = doc(db, 'rooms', roomId, 'students', userId);
    const userJoinedRoomRef = doc(db, 'users', userId, 'joinedRooms', roomId);

    await runTransaction(db, async (transaction) => {
        const roomDoc = await transaction.get(roomRef);
        if (!roomDoc.exists()) {
            throw new Error("Room not found.");
        }
        const studentDoc = await transaction.get(studentRef);

        if (studentDoc.exists() && studentDoc.data().balance > 0) {
            throw new Error("You cannot leave the room with an outstanding balance.");
        }

        // 1. Remove user from room's members list
        transaction.update(roomRef, {
            members: arrayRemove(userId)
        });

        // 2. Remove room from user's rooms list
        transaction.update(userRef, {
            rooms: arrayRemove(roomId)
        });
        
        // 3. Delete from the user's joinedRooms subcollection
        transaction.delete(userJoinedRoomRef);

        // 4. Delete the student-specific details doc
        if (studentDoc.exists()) {
            transaction.delete(studentRef);
        }
    });
};


export const addPayment = async (roomId: string, studentId: string, chairpersonName: string, deadlineId: string, amount: number, deadlineDescription: string) => {
    const roomRef = doc(db, 'rooms', roomId);
    const studentRef = doc(db, 'rooms', roomId, 'students', studentId);
    const roomDocSnap = await getDoc(roomRef);
    const roomData = roomDocSnap.data();

    if (!roomData) throw new Error("Room not found");

    try {
        await runTransaction(db, async (transaction) => {
            const studentDoc = await transaction.get(studentRef);
            if (!studentDoc.exists()) {
                // If student doc doesn't exist, create it. This can happen if they were a member before the 'students' subcollection was introduced.
                transaction.set(studentRef, { totalPaid: 0, totalOwed: 0, balance: 0, lastPaymentAt: null});
            }

             const studentData = studentDoc.data()
            const userDocSnap = await getDoc(doc(db, 'users', studentId));
            const studentName = userDocSnap.data()?.name || 'Unknown Student';


            // 1. Create a payment transaction record ('credit')
            const paymentRef = doc(collection(db, 'rooms', roomId, 'transactions'));
            transaction.set(paymentRef, {
                roomId: roomId,
                userId: studentId,
                userName: studentName,
                amount: amount,
                type: 'credit',
                description: deadlineDescription,
                deadlineId: deadlineId,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                seenBy: [studentId, roomData.createdBy]
            });

            // 2. Update the student's totals
            transaction.update(studentRef, {
                totalPaid: increment(amount),
                totalOwed: increment(-amount),
                balance: increment(-amount),
                lastPaymentAt: serverTimestamp()
            });

            // 3. Update the room's total collected amount
            transaction.update(roomRef, {
                totalCollected: increment(amount)
            });
        });
    } catch (error) {
        console.error("Error adding payment: ", error);
        throw new Error("Could not process payment.");
    }
}

export const archiveRoom = async (roomId: string, archived: boolean) => {
    try {
        const batch = writeBatch(db);
        const roomRef = doc(db, 'rooms', roomId);

        // Update the main room document
        batch.update(roomRef, {
            archived: archived,
        });

        // Get all members to update their joinedRooms subcollection
        const roomDoc = await getDoc(roomRef);
        const members = roomDoc.data()?.members || [];
        
        for (const memberId of members) {
            const joinedRoomRef = doc(db, 'users', memberId, 'joinedRooms', roomId);
            if(archived) {
                // If we archive the room, we can just delete it from the user's active list
                batch.delete(joinedRoomRef);
            }
            // Note: Restoring an archived room is more complex as we'd need to reconstruct
            // the joinedRooms documents for all members. This is handled in the unarchive flow.
        }

        await batch.commit();

    } catch (error) {
        console.error("Error updating room archive status: ", error);
        throw new Error("Could not update room status.");
    }
}

export const unarchiveRoom = async (roomId: string) => {
    const roomRef = doc(db, 'rooms', roomId);
    const batch = writeBatch(db);

    // 1. Unarchive the room
    batch.update(roomRef, { archived: false });

    // 2. Re-create the joinedRooms metadata for all members
    const roomDoc = await getDoc(roomRef);
    if (!roomDoc.exists()) {
        throw new Error("Room to unarchive not found.");
    }
    const roomData = roomDoc.data();
    const members = roomData.members || [];

    for (const memberId of members) {
        const joinedRoomRef = doc(db, 'users', memberId, 'joinedRooms', roomId);
        batch.set(joinedRoomRef, {
            roomName: roomData.name,
            roomDescription: roomData.description || '',
            chairpersonId: roomData.createdBy,
            chairpersonName: roomData.createdByName,
            code: roomData.code,
            joinedAt: roomData.createdAt, // Or a new serverTimestamp
        });
    }

    await batch.commit();
}
