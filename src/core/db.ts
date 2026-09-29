import Dexie, { type Table } from 'dexie';

export interface Task {
  id?: number;
  title: string;
  category: string;
  dueDate?: string;
  dueTime?: string;
  isCompleted: boolean;
  isArchived: boolean;        // 成就墙/归档标记
  archiveNote?: string;       // 成就墙的手动备注
  reminderRule?: string;      // 例如 "every_2_hours", "once"
  createdAt: number;
}

export interface ChatMessage {
  id?: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  extractedTask?: any;        // 结构化关联的任务数据
  timestamp: number;
}

export interface Settings {
  id?: number;
  theme: 'mist' | 'peach';
  language: 'zh' | 'en';
  apiKey: string;
  baseUrl: string;
  selectedModel: string;
  persona: string;
  cloudBackupUrl: string;
  notificationsEnabled: boolean;
}

export class KomorebiDatabase extends Dexie {
  tasks!: Table<Task, number>;
  chats!: Table<ChatMessage, number>;
  settings!: Table<Settings, number>;

  constructor() {
    super('KomorebiDB');
    this.version(1).stores({
      tasks: '++id, category, dueDate, isCompleted, isArchived, createdAt',
      chats: '++id, timestamp',
      settings: '++id'
    });
  }

  // 严格限制最大 100 条聊天记录
  async addChatMessage(msg: Omit<ChatMessage, 'id' | 'timestamp'>) {
    const count = await this.chats.count();
    if (count >= 100) {
      // 删掉最旧的多余记录
      const oldest = await this.chats.orderBy('timestamp').limit(count - 99).primaryKeys();
      await this.chats.bulkDelete(oldest);
    }
    return this.chats.add({
      ...msg,
      timestamp: Date.now()
    });
  }
}

export const db = new KomorebiDatabase();
