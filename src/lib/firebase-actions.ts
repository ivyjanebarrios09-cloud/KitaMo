
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export const createRoom = async (ownerId: string, data: { name: string, description?: string }) => {
    try {
        await addDoc(collection(db, "rooms"), {
            ...data,
            ownerId,
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
