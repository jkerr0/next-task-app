import { NextApiRequest, NextApiResponse } from "next";
import getTodoDb from "../../../services/mongo";

export default async function (request: NextApiRequest, response: NextApiResponse) {
    if (request.method === 'POST') {
        try {
            const db = await getTodoDb()
            const task = await db.collection('tasks')
                .insertOne({
                    name: request.body['name'],
                    done: request.body['done']
                })
            response.json(JSON.parse(JSON.stringify(task)))
        } catch (e) {
            response.status(400)
        }
    } else {
        response.status(404)
    }
}