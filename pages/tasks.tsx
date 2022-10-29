import { ObjectId } from "mongodb"
import { ChangeEvent, useState } from "react"
import getTodoDb from "../services/mongo"

export interface Task {
    _id: ObjectId,
    name: string,
    done: boolean
}

interface TaskProps {
    readyTasks: Task[]
    doneTasks: Task[]
}

export async function getServerSideProps() {
    try {
        const db = await getTodoDb()
        const collection = db.collection('tasks')
        const doneTasks = await collection.find<Task>({})
            .filter({ done: true })
            .sort({ name: 1 })
            .toArray();
        const readyTasks = await collection.find<Task>({})
            .filter({ done: false })
            .sort({ name: 1 })
            .toArray();
        return {
            props: {
                readyTasks: JSON.parse(JSON.stringify(readyTasks)),
                doneTasks: JSON.parse(JSON.stringify(doneTasks))
            }
        }
    } catch (e) {
        console.error(e)
    }
}

export default function TasksPage({ readyTasks, doneTasks }: TaskProps) {

    const API_URL = 'http://localhost:3000/api/tasks'

    const [readyTasksState, setReadyTasks] = useState(readyTasks)
    const [doneTasksState, setDoneTasks] = useState(doneTasks)

    const [newTaskName, setNewTaskName] = useState('')

    async function updateTask(task: Task) {
        await fetch(API_URL, {
            method: 'PUT',
            body: JSON.stringify(task),
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        })
    }

    async function handleTaskCheckbox(event: ChangeEvent<HTMLInputElement>, task: Task) {
        const removedTasksSetter = task.done ? setDoneTasks : setReadyTasks
        const addedTasksSetter = task.done ? setReadyTasks : setDoneTasks
        const currentTasksList = task.done ? doneTasksState : readyTasksState
        const otherTasksList = task.done ? readyTasksState : doneTasksState
        removedTasksSetter(currentTasksList.filter(otherTask => otherTask !== task))
        task.done = !task.done
        addedTasksSetter([...otherTasksList, task])
        await updateTask(task)
    }

    async function createTask(taskName: string): Promise<Task> {
        const newTask = {
            name: taskName,
            done: false
        }
        const response = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify(newTask),
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        }).then(response => response.json())
        return {
            _id: response['insertedId'],
            ...newTask
        }
    }

    async function handleNewTask(taskName: string) {
        setReadyTasks([...readyTasksState, await createTask(taskName)])
        setNewTaskName('')
    }

    function renderTask(task: Task) {
        return (
            <div key={task._id.toString()}>
                <label>{task.done ? <del>{task.name}</del> : task.name}</label>
                <input
                    type='checkbox'
                    onChange={e => handleTaskCheckbox(e, task)}
                    checked={task.done}>
                </input>
                <input
                    type='button'
                    value='Delete'
                    onClick={e => handleDelete(task)}>
                </input>
            </div>
        )
    }

    async function handleDelete(task: Task) {
        const currentTasksList = task.done ? doneTasksState : readyTasksState
        const currentTasksListSetter = task.done ? setDoneTasks : setReadyTasks
        currentTasksListSetter(currentTasksList.filter(otherTask => otherTask !== task))
        await deleteTask(task._id)
    }

    async function deleteTask(taskId: ObjectId) {
        await fetch(API_URL, {
            method: 'DELETE',
            body: JSON.stringify({ _id: taskId }),
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        })
    }
    return (
        <>
            <h1>Tasks</h1>
            <div>
                <h2>TODO</h2>
                {readyTasksState.map(renderTask)}
                <input
                    type='text'
                    value={newTaskName}
                    onChange={e => setNewTaskName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleNewTask(newTaskName)}></input>
                <input
                    type='button'
                    value='Add'
                    onClick={e => handleNewTask(newTaskName)}></input>
            </div>
            <div>
                <h2>DONE</h2>
                {doneTasksState.map(renderTask)}
            </div>
        </>
    )
}
