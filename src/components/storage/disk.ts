import * as fs from 'fs'
import * as path from 'path'
import { UserStorage, EventLogStorage } from './types'
import { mkdirSyncIfNotExists } from '../../utils/fs'

export class UserDiskStorage implements UserStorage {
    public basePath : string

    constructor({basePath} : {basePath : string}) {
        this.basePath = basePath
    }

    async storeUser(id: string, installTime: number) {

        // If the user is first user, make public directory
        mkdirSyncIfNotExists(this.basePath)
        
        // Make directory public/users
        mkdirSyncIfNotExists(this.basePath + '/users')

        const users = await this._readFile()
        users.push([id, installTime])

        require('csv-stringify')(users, (err, output) => {
            fs.writeFileSync(path.join(this.basePath, 'users', 'users.csv'), output)
        })
        
        return {"id": id, success: true}
    }

    async userExists(id) {
        const isUserDirExists = this._isDirExists('/users')

        if(!isUserDirExists) {
            return true
        }

        const users = await this._readFile()

        users.forEach((user) => {
            if(user[0] === id) {
                return false
            }
        })
        
        return true
    }

    async _readFile() {
        const filePath = path.join(this.basePath, 'users', 'users.csv')

        if(!fs.existsSync(filePath)) {
            return []
        }

        let stream = fs.createReadStream(filePath)

        let users = []

        await new Promise((resolve, reject) => {
            require("fast-csv").fromStream(stream)
                .on('data', (e) => {
                    users.push(e)
                })
                .on('end', () => {
                    resolve()
                })
            })
        
        return users
    }

    _isDirExists(url:string) {
        const dirPath = this.basePath + url
        return fs.existsSync(dirPath)
    }
}

export class EventDiskStorage implements EventLogStorage {
    public basePath : string

    constructor({basePath} : {basePath : string}) {
        this.basePath = basePath
    }

    async storeEvents(events: any) {
        // If the user is first user, make public directory
        mkdirSyncIfNotExists(this.basePath)
        
        // Create directory: public/events
        mkdirSyncIfNotExists(this.basePath + '/events')

        const allEvent = await this._readFile()

        events.data.forEach((event) => {
            allEvent.push([event.time, events.id, event.other, event.type])
        })

        require('csv-stringify')(allEvent, (err, output) => {
            if (err) { throw err }
            fs.writeFileSync(path.join(this.basePath, 'events', 'events.csv'), output)
        })
    }

    async _readFile() {
        const filePath = path.join(this.basePath, 'events', 'events.csv')

        if(!fs.existsSync(filePath)) {
            return []
        }

        let stream = fs.createReadStream(filePath)

        let events = []

        await new Promise((resolve, reject) => {
            require("fast-csv").fromStream(stream)
                .on('data', (e) => {
                    events.push(e)
                })
                .on('end', () => {
                    resolve()
                })
            })
        
        return events
    }

    _isDirExists(url:string) {
        const dirPath = this.basePath + url
        return fs.existsSync(dirPath)
    }
}