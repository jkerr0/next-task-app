import { ObjectId } from "mongodb"
import { ChangeEvent, useState } from "react"
import clientPromise from "../lib/mongodb"
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

async function createTask(name: string): Promise<Task> {
    return Promise.reject()
}


export default function TasksPage({ readyTasks, doneTasks }: TaskProps) {

    const [readyTasksState, setReadyTasks] = useState(readyTasks)
    const [doneTasksState, setDoneTasks] = useState(doneTasks)

    const [newTaskName, setNewTaskName] = useState('')

    function handleTaskCheckbox(event: ChangeEvent<HTMLInputElement>, task: Task) {
        const removedTasksSetter = task.done ? setDoneTasks : setReadyTasks
        const addedTasksSetter = task.done ? setReadyTasks : setDoneTasks
        const currentTasksList = task.done ? doneTasksState : readyTasksState
        const otherTasksList = task.done ? readyTasksState : doneTasksState
        removedTasksSetter(currentTasksList.filter(otherTask => otherTask !== task))
        task.done = !task.done
        addedTasksSetter([...otherTasksList, task])
    }

    async function handleNewTask(taskName: string) {
        const task = {
            name: taskName,
            done: false
        }
        const response = await fetch('http://localhost:3000/api/tasks', {
            method: 'POST',
            body: JSON.stringify(task)
        })
        console.log(response)
        // setReadyTasks([...readyTasksState, task])
        setNewTaskName('')
    }

    function renderTask(task: Task) {
        return (
            <div key={task._id.toString()}>
                <label>{task.done ? <del>{task.name}</del> : task.name}</label>
                <input
                    type='checkbox'
                    key={task._id.toString()}
                    onChange={e => handleTaskCheckbox(e, task)}
                    checked={task.done}>
                </input>
            </div>
        )
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
            </div>
            <div>
                <h2>DONE</h2>
                {doneTasksState.map(renderTask)}
            </div>
        </>
    )
}
