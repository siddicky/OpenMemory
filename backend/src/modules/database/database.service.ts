import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import sqlite3 from 'sqlite3';
import { ConfigService } from '../config/config.service';
import fs from 'node:fs';
import path from 'node:path';

@Injectable()
export class DatabaseService implements OnModuleInit {
    private db: sqlite3.Database;
    
    constructor(
        @Inject(ConfigService) private readonly configService: ConfigService
    ) {}

    async onModuleInit() {
        const dir = path.dirname(this.configService.db_path);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        
        this.db = new sqlite3.Database(this.configService.db_path);
        
        await this.initializeTables();
    }

    private initializeTables(): Promise<void> {
        return new Promise((resolve) => {
            this.db.serialize(() => {
                this.db.run(`
                    create table if not exists memories(
                    id text primary key,
                    content text not null,
                    primary_sector text not null,
                    tags text,
                    meta text,
                    created_at integer,
                    updated_at integer,
                    last_seen_at integer,
                    salience real,
                    decay_lambda real,
                    version integer default 1,
                    mean_dim integer,
                    mean_vec blob
                    )
                `);
                this.db.run(`
                    create table if not exists vectors(
                    id text not null,
                    sector text not null,
                    v blob not null,
                    dim integer not null,
                    primary key(id, sector)
                    )
                `);
                this.db.run(`
                    create table if not exists waypoints(
                    src_id text primary key,
                    dst_id text not null,
                    weight real not null,
                    created_at integer,
                    updated_at integer
                    )
                `);
                this.db.run(`
                    create table if not exists embed_logs(
                    id text primary key,
                    model text,
                    status text,
                    ts integer,
                    err text
                    )
                `);
                this.db.run('create index if not exists idx_memories_sector on memories(primary_sector)');
                this.db.run('create index if not exists idx_waypoints_src on waypoints(src_id)');
                this.db.run('create index if not exists idx_waypoints_dst on waypoints(dst_id)', () => {
                    resolve();
                });
            });
        });
    }

    runAsync(sql: string, params: any[] = []): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function (err) {
                if (err) {
                    console.error('[DB ERROR]', err.message);
                    console.error('[DB SQL]', sql);
                    console.error('[DB PARAMS]', params.length, 'params:', params.slice(0, 3));
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    getAsync(sql: string, params: any[] = []): Promise<any> {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    allAsync(sql: string, params: any[] = []): Promise<any[]> {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    async beginTransaction(): Promise<void> {
        return this.runAsync('BEGIN TRANSACTION');
    }

    async commitTransaction(): Promise<void> {
        return this.runAsync('COMMIT');
    }

    async rollbackTransaction(): Promise<void> {
        return this.runAsync('ROLLBACK');
    }

    // Query methods
    async insertMemory(...params: any[]): Promise<void> {
        return this.runAsync('insert into memories(id,content,primary_sector,tags,meta,created_at,updated_at,last_seen_at,salience,decay_lambda,version,mean_dim,mean_vec) values(?,?,?,?,?,?,?,?,?,?,?,?,?)', params);
    }

    async updateMeanVector(...params: any[]): Promise<void> {
        return this.runAsync('update memories set mean_dim=?, mean_vec=? where id=?', params);
    }

    async updateLastSeen(...params: any[]): Promise<void> {
        return this.runAsync('update memories set last_seen_at=?, salience=?, updated_at=? where id=?', params);
    }

    async deleteMemory(...params: any[]): Promise<void> {
        return this.runAsync('delete from memories where id=?', params);
    }

    async getMemory(id: string): Promise<any> {
        return this.getAsync('select * from memories where id=?', [id]);
    }

    async getAllMemories(limit: number, offset: number): Promise<any[]> {
        return this.allAsync('select * from memories order by created_at desc limit ? offset ?', [limit, offset]);
    }

    async getAllMemoriesBySector(sector: string, limit: number, offset: number): Promise<any[]> {
        return this.allAsync('select * from memories where primary_sector=? order by created_at desc limit ? offset ?', [sector, limit, offset]);
    }

    async insertVector(...params: any[]): Promise<void> {
        return this.runAsync('insert into vectors(id,sector,v,dim) values(?,?,?,?)', params);
    }

    async getVector(id: string, sector: string): Promise<any> {
        return this.getAsync('select v,dim from vectors where id=? and sector=?', [id, sector]);
    }

    async getVectorsById(id: string): Promise<any[]> {
        return this.allAsync('select sector,v,dim from vectors where id=?', [id]);
    }

    async getVectorsBySector(sector: string): Promise<any[]> {
        return this.allAsync('select id,v,dim from vectors where sector=?', [sector]);
    }

    async deleteVectors(...params: any[]): Promise<void> {
        return this.runAsync('delete from vectors where id=?', params);
    }

    async deleteVectorSector(...params: any[]): Promise<void> {
        return this.runAsync('delete from vectors where id=? and sector=?', params);
    }

    async insertWaypoint(...params: any[]): Promise<void> {
        return this.runAsync('insert or replace into waypoints(src_id,dst_id,weight,created_at,updated_at) values(?,?,?,?,?)', params);
    }

    async getNeighbors(src_id: string): Promise<any[]> {
        return this.allAsync('select dst_id,weight from waypoints where src_id=? order by weight desc', [src_id]);
    }

    async getWaypoint(src_id: string, dst_id: string): Promise<any> {
        return this.getAsync('select weight from waypoints where src_id=? and dst_id=?', [src_id, dst_id]);
    }

    async updateWaypoint(...params: any[]): Promise<void> {
        return this.runAsync('update waypoints set weight=?, updated_at=? where src_id=? and dst_id=?', params);
    }

    async deleteWaypoints(...params: any[]): Promise<void> {
        return this.runAsync('delete from waypoints where src_id=? or dst_id=?', params);
    }

    async pruneWaypoints(threshold: number): Promise<void> {
        return this.runAsync('delete from waypoints where weight < ?', [threshold]);
    }

    async insertLog(...params: any[]): Promise<void> {
        return this.runAsync('insert into embed_logs(id,model,status,ts,err) values(?,?,?,?,?)', params);
    }

    async updateLog(...params: any[]): Promise<void> {
        return this.runAsync('update embed_logs set status=?, err=? where id=?', params);
    }

    async getPendingLogs(): Promise<any[]> {
        return this.allAsync('select * from embed_logs where status=?', ['pending']);
    }

    async getFailedLogs(): Promise<any[]> {
        return this.allAsync('select * from embed_logs where status=? order by ts desc limit 100', ['failed']);
    }
}
