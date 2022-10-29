import { ObjectId } from "mongodb";
import { NextApiRequest, NextApiResponse } from "next";
import getTodoDb from "../../../services/mongo";

async function handleGet(request: NextApiRequest, response: NextApiResponse) {
    try {
        const db = await getTodoDb()
        const tasks = await db.collection('tasks')
            .find({})
            .toArray()
        response.json(JSON.parse(JSON.stringify(tasks)))
    } catch (e) {
        response.status(500)
    }
}

async function handlePost(request: NextApiRequest, response: NextApiResponse) {
    try {
        const db = await getTodoDb()
        const taskResponse = await db.collection('tasks')
            .insertOne({
                name: request.body['name'],
                done: request.body['done']
            })
        response.json(JSON.parse(JSON.stringify(taskResponse)))
    } catch (e) {
        response.status(400)
    }
}

async function handlePut(request: NextApiRequest, response: NextApiResponse) {
    try {
        const db = await getTodoDb()
        const taskResponse = await db.collection('tasks')
            .updateOne({ _id: new ObjectId(request.body['_id']) }, {
                "$set": {
                    name: request.body['name'],
                    done: request.body['done']
                }
            })
        response.json(taskResponse)
    } catch (e) {
        response.status(400)
    }
}

async function handleDelete(request: NextApiRequest, response: NextApiResponse) {
    try {
        const db = await getTodoDb()
        const deleteResponse = db.collection('tasks')
            .deleteOne({ _id: new ObjectId(request.body['_id']) })
        response.json(deleteResponse)
    } catch (e) {
        response.status(400)
    }
}

export default async function (request: NextApiRequest, response: NextApiResponse) {
    switch (request.method) {
        case 'POST': await handlePost(request, response); break;
        case 'PUT': await handlePut(request, response); break;
        case 'GET': await handleGet(request, response); break;
        case 'DELETE': await handleDelete(request, response); break;
        default: response.status(404)
    }
}