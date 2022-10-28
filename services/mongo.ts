import clientPromise from "../lib/mongodb";

export default async function getTodoDb() {
    const client = await clientPromise;
    const db = client.db('todo_database');
    return db;
}