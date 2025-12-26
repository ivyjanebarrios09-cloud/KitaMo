

import { addDoc, collection, serverTimestamp, writeBatch, doc, getDocs, query, where, updateDoc, deleteDoc, runTransaction, increment, arrayUnion, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { customAlphabet } from 'nanoid';

// Generate a unique 6-character alphanumeric code
const nanoid = customAlphabet('1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ', 6);


export const createRoom = async (ownerId: string, ownerName: string, data: { name: string, description?: string }) => {
    try {
        const roomCode = nanoid();
        await addDoc(collection(db, "rooms"), {
            ...data,
            ownerId,
            ownerName,
            code: roomCode,
            createdAt: serverTimestamp(),
            studentCount: 0,
            totalCollected: 0,
            totalExpenses: 0,
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

        // Delete the room itself
        const roomRef = doc(db, 'rooms', roomId);
        batch.delete(roomRef);

        // Delete all subcollections
        const subcollections = ['students', 'expenses', 'deadlines', 'announcements', 'transactions'];
        for (const sub of subcollections) {
            const subcollectionRef = collection(db, 'rooms', roomId, sub);
            const snapshot = await getDocs(subcollectionRef);
            snapshot.forEach(doc => batch.delete(doc.ref));
        }

        await batch.commit();

    } catch (error) {
        console.error("Error deleting room: ", error);
        throw new Error("Could not delete room.");
    }
}


export const addExpense = async (roomId: string, data: { name: string, description?: string, amount: number, date: Date }) => {
    try {
        const roomRef = doc(db, 'rooms', roomId);
        
        await runTransaction(db, async (transaction) => {
            const roomDoc = await transaction.get(roomRef);
            if (!roomDoc.exists()) {
                throw "Room does not exist!";
            }
            
            const ownerId = roomDoc.data().ownerId;

            // Add to expenses subcollection
            const expenseRef = doc(collection(db, 'rooms', roomId, 'expenses'));
            transaction.set(expenseRef, {
                ...data,
                createdAt: serverTimestamp()
            });

            // Add to general transactions log
            const transactionRef = doc(collection(db, 'rooms', roomId, 'transactions'));
            transaction.set(transactionRef, {
                type: 'expense',
                name: data.name,
                amount: data.amount,
                date: data.date,
                ownerId: ownerId,
                roomId: roomId,
                createdAt: serverTimestamp(),
                seenCount: 0,
                seenBy: []
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

export const addDeadline = async (roomId: string, data: { title: string, amount: number, dueDate: Date, category?: string, description: string }) => {
    try {
        const roomRef = doc(db, 'rooms', roomId);
        
        await runTransaction(db, async (transaction) => {
            const roomDoc = await transaction.get(roomRef);
            if (!roomDoc.exists()) {
                throw "Room does not exist!";
            }
            
            const ownerId = roomDoc.data().ownerId;

            // Add to deadlines subcollection
            const deadlineRef = doc(collection(db, 'rooms', roomId, 'deadlines'));
            transaction.set(deadlineRef, {
                name: data.title,
                amount: data.amount,
                date: data.dueDate,
                category: data.category,
                description: data.description,
                createdAt: serverTimestamp()
            });

            // Add to general transactions log
            const transactionRef = doc(collection(db, 'rooms', roomId, 'transactions'));
            transaction.set(transactionRef, {
                type: 'deadline',
                name: data.title,
                amount: data.amount,
                date: data.dueDate,
                ownerId: ownerId,
                roomId: roomId,
                createdAt: serverTimestamp(),
                seenCount: 0,
                seenBy: []
            });
        });
    } catch (error) {
        console.error("Error adding deadline: ", error);
        throw new Error("Could not add deadline.");
    }
};


export const addAnnouncement = async (roomId: string, userId: string, userName: string, data: { title: string, content: string }) => {
    try {
        await addDoc(collection(db, 'rooms', roomId, 'announcements'), {
            ...data,
            authorId: userId,
            authorName: userName,
            createdAt: serverTimestamp(),
        });
    } catch (error) {
        console.error("Error adding announcement: ", error);
        throw new Error("Could not add announcement.");
    }
}


export const markTransactionAsSeen = async (roomId: string, transactionId: string, userId: string) => {
    try {
        const transactionRef = doc(db, 'rooms', roomId, 'transactions', transactionId);
        
        await runTransaction(db, async (transaction) => {
            const transactionDoc = await transaction.get(transactionRef);
            if (!transactionDoc.exists()) {
                throw "Transaction does not exist!";
            }

            const seenBy = transactionDoc.data().seenBy || [];
            if (!seenBy.includes(userId)) {
                 transaction.update(transactionRef, {
                    seenCount: increment(1),
                    seenBy: arrayUnion(userId)
                });
            }
        });

    } catch (error) {
        console.error("Error marking transaction as seen: ", error);
        // We don't throw an error here to prevent crashing the app for the user
        // But we log it for debugging purposes.
    }
};

export const joinRoom = async (roomCode: string, userId: string, studentName: string, studentEmail: string) => {
    const roomsRef = collection(db, 'rooms');
    const q = query(roomsRef, where("code", "==", roomCode));
    
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        throw new Error("No room found with that code.");
    }

    const roomDoc = querySnapshot.docs[0];
    const roomId = roomDoc.id;
    const roomRef = doc(db, 'rooms', roomId);

    await runTransaction(db, async (transaction) => {
        const studentRef = doc(db, 'rooms', roomId, 'students', userId);
        const studentDoc = await transaction.get(studentRef);

        if (studentDoc.exists()) {
            throw new Error("You are already a member of this room.");
        }

        transaction.set(studentRef, {
            name: studentName,
            email: studentEmail,
            joinedAt: serverTimestamp(),
            totalPaid: 0,
            totalOwed: 0, // This would be updated when new deadlines are posted
        });

        transaction.update(roomRef, {
            studentCount: increment(1)
        });
    });
};
