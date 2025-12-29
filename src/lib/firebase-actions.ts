

import { addDoc, collection, serverTimestamp, writeBatch, doc, getDocs, query, where, updateDoc, deleteDoc, runTransaction, increment, arrayUnion, getDoc, collectionGroup, arrayRemove } from "firebase/firestore";
import { db } from "./firebase";
import { customAlphabet } from 'nanoid';

// Generate a unique 6-character alphanumeric code
const nanoid = customAlphabet('1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ', 6);

export const createRoom = async (createdBy: string, createdByName: string, data: { name: string, description?: string }) => {
    try {
        const roomCode = nanoid();
        const roomRef = await addDoc(collection(db, "rooms"), {
            ...data,
            createdBy,
            createdByName,
            code: roomCode,
            createdAt: serverTimestamp(),
            members: [createdBy], // Creator is the first member
            totalCollected: 0,
            totalExpenses: 0,
        });

        // Also add room to the creator's user document
        const userRef = doc(db, 'users', createdBy);
        await updateDoc(userRef, {
            rooms: arrayUnion(roomRef.id)
        });

    } catch (error) {
        console.error("Error creating room: ", error);
        throw new Error("Could not create room.");
    }
}

export const updateRoom = async (roomId: string, data: { name: string, description?: string }) => {
    try {
        const roomRef = doc(db, 'rooms', roomId);
        await updateDoc(roomRef, data);
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

        // Remove room from each member's user document
        for (const memberId of members) {
            const userRef = doc(db, 'users', memberId);
            batch.update(userRef, {
                rooms: arrayRemove(roomId)
            });
        }

        await batch.commit();

    } catch (error) {
        console.error("Error deleting room: ", error);
        throw new Error("Could not delete room.");
    }
}

export const addExpense = async (roomId: string, userId: string, userName: string, data: { description: string, amount: number, date: Date }) => {
    try {
        const roomRef = doc(db, 'rooms', roomId);
        
        await runTransaction(db, async (transaction) => {
            // Add to general transactions log
            const transactionRef = doc(collection(db, 'rooms', roomId, 'transactions'));
            transaction.set(transactionRef, {
                roomId: roomId,
                userId: userId,
                userName: userName,
                amount: data.amount,
                type: 'debit',
                description: data.description,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                seenBy: [userId],
            });

            // Update total expenses in the room document
            transaction.update(roomRef, {
                totalExpenses: increment(data.amount)
            });
        });

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

    // 2. Update totalOwed for all members in the room (in the /students subcollection)
    for (const memberId of members) {
      if (memberId !== createdBy) { 
        const studentToUpdateRef = doc(db, 'rooms', roomId, 'students', memberId);
        transaction.update(studentToUpdateRef, {
          totalOwed: increment(data.amount),
        });
      }
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

    // Can't join if you're the creator
    if (roomData.createdBy === userId) {
        throw new Error("You are the creator of this room and cannot join as a student.");
    }

    await runTransaction(db, async (transaction) => {
        const roomTransactionDoc = await transaction.get(roomRef);
        const members = roomTransactionDoc.data()?.members || [];
        if (members.includes(userId)) {
            throw new Error("You are already a member of this room.");
        }

        // --- Calculate initial debt ---
        const deadlinesRef = collection(db, 'rooms', roomId, 'transactions');
        const deadlinesQuery = query(deadlinesRef, where('type', '==', 'deadline'));
        const deadlinesSnapshot = await getDocs(deadlinesQuery);
        let initialOwed = 0;
        deadlinesSnapshot.forEach(doc => {
            initialOwed += doc.data().amount;
        });
        // --- End calculation ---

        // Add user to room's members list
        transaction.update(roomRef, {
            members: arrayUnion(userId)
        });

        // Add room to user's rooms list
        transaction.update(userRef, {
            rooms: arrayUnion(roomId)
        })

        // Create the student-specific details doc in the room
        const studentRef = doc(db, 'rooms', roomId, 'students', userId);
        transaction.set(studentRef, {
            totalPaid: 0,
            totalOwed: initialOwed,
        });
    });
};

export const leaveRoom = async (roomId: string, userId: string) => {
    const roomRef = doc(db, 'rooms', roomId);
    const userRef = doc(db, 'users', userId);
    const studentRef = doc(db, 'rooms', roomId, 'students', userId);
    const studentTransactionsRef = collection(db, 'rooms', roomId, 'transactions');

    await runTransaction(db, async (transaction) => {
        const roomDoc = await transaction.get(roomRef);
        if (!roomDoc.exists()) {
            throw new Error("Room not found.");
        }
        const roomData = roomDoc.data();
        const studentDoc = await transaction.get(studentRef);

        // Prevent leaving if there's an outstanding balance
        if (studentDoc.exists() && studentDoc.data().totalOwed > 0) {
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

        // 3. Delete the student-specific details doc
        if (studentDoc.exists()) {
            transaction.delete(studentRef);
        }
        
        // 4. (Optional but good practice) Delete student's payment transactions to clean up.
        // This is more complex and might be better handled via a Cloud Function for atomicity.
        // For now, we will leave them for historical record, but they won't be easily accessible.
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
                transaction.set(studentRef, { totalPaid: 0, totalOwed: 0});
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
                description: `Payment for ${deadlineDescription}`,
                deadlineId: deadlineId,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                seenBy: [studentId, roomData.createdBy]
            });

            // 2. Update the student's totals
            transaction.update(studentRef, {
                totalPaid: increment(amount),
                totalOwed: increment(-amount),
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
