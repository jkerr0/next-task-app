import { ObjectId } from "mongodb"
import Head from "next/head"
import { useState } from "react"
import { Accordion, Button, Card, Col, Container, Form, InputGroup, Row, Stack } from "react-bootstrap"
import getTodoDb from "../services/mongo"
import 'bootstrap/dist/css/bootstrap.min.css'

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

    async function handleTaskCheckbox(task: Task) {
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
            <Container>
                <Row>
                    <Col sm={9}>
                        <span>{task.done ? <del>{task.name}</del> : task.name}</span>
                    </Col>
                    <Col sm={3}>
                        <InputGroup className='mx-auto' key={task._id.toString()}>
                            <InputGroup.Checkbox
                                onChange={() => handleTaskCheckbox(task)}
                                checked={task.done}>
                            </InputGroup.Checkbox>
                            <Button
                                variant='outline-danger'
                                onClick={() => handleDelete(task)}>
                                Delete
                            </Button>
                        </InputGroup>
                    </Col>
                </Row>
            </Container>
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
            <Head>
                <link
                    rel="stylesheet"
                    href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.2/dist/css/bootstrap.min.css"
                    integrity="sha384-Zenh87qX5JnK2Jl0vWa8Ck2rdkQ2Bzep5IDxbcnCeuOxjzrPF/et3URy9Bv1WTRi"
                    crossOrigin="anonymous"
                />
            </Head>
            <Container className='my-5'>
                <Card>
                    <Card.Header>Task list</Card.Header>
                    <Card.Body>
                        <Stack gap={2} className='mx-auto'>
                            {readyTasksState.map(renderTask)}
                            <InputGroup>
                                <Form.Control
                                    value={newTaskName}
                                    onChange={e => setNewTaskName(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleNewTask(newTaskName)}></Form.Control>
                                <Button
                                    type='button'
                                    onClick={e => handleNewTask(newTaskName)}>Add</Button>
                            </InputGroup>
                        </Stack>
                    </Card.Body>
                </Card>
                <Accordion>
                    <Accordion.Item eventKey="0">
                        <Accordion.Header>Done tasks</Accordion.Header>
                        <Accordion.Body>
                            <Stack gap={2}>
                                {doneTasksState.map(renderTask)}
                            </Stack>
                        </Accordion.Body>
                    </Accordion.Item>
                </Accordion>

            </Container>
        </>
    )
}
