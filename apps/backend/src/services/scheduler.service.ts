/**
 * Scheduler Service - Cron-based task scheduling for RENEC sync and maintenance
 *
 * Uses node-cron for scheduling recurring tasks:
 * - RENEC data sync (EC standards, certifiers, centers)
 * - Data cleanup and maintenance
 * - Geocoding batch jobs
 */

import type { PrismaClient } from "@prisma/client";
import { RenecSyncService } from "./renec/sync.service";

// Simple cron parser and scheduler (no external deps)
interface ScheduledTask {
  name: string;
  schedule: string; // cron expression
  fn: () => Promise<void>;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
  running: boolean;
}

// Parse cron expression to get next run time
// Supports: minute hour day month dayOfWeek
function parseCronExpression(
  expression: string,
): { minute: number[]; hour: number[]; day: number[]; month: number[]; dayOfWeek: number[] } {
  const parts = expression.trim().split(/\s+/);
  if (parts.length !== 5) {
    throw new Error(`Invalid cron expression: ${expression}`);
  }

  const parseField = (field: string, min: number, max: number): number[] => {
    if (field === "*") {
      return Array.from({ length: max - min + 1 }, (_, i) => i + min);
    }
    if (field.includes("/")) {
      const [, step] = field.split("/");
      const stepNum = parseInt(step, 10);
      return Array.from({ length: max - min + 1 }, (_, i) => i + min).filter(
        (n) => (n - min) % stepNum === 0,
      );
    }
    if (field.includes(",")) {
      return field.split(",").map((n) => parseInt(n, 10));
    }
    if (field.includes("-")) {
      const [start, end] = field.split("-").map((n) => parseInt(n, 10));
      return Array.from({ length: end - start + 1 }, (_, i) => i + start);
    }
    return [parseInt(field, 10)];
  };

  return {
    minute: parseField(parts[0], 0, 59),
    hour: parseField(parts[1], 0, 23),
    day: parseField(parts[2], 1, 31),
    month: parseField(parts[3], 1, 12),
    dayOfWeek: parseField(parts[4], 0, 6),
  };
}

function getNextRunTime(expression: string, from: Date = new Date()): Date {
  const parsed = parseCronExpression(expression);
  const next = new Date(from);
  next.setSeconds(0);
  next.setMilliseconds(0);

  // Move to next minute
  next.setMinutes(next.getMinutes() + 1);

  // Find next matching time (max 1 year lookahead)
  const maxIterations = 525600; // minutes in a year
  for (let i = 0; i < maxIterations; i++) {
    const minute = next.getMinutes();
    const hour = next.getHours();
    const day = next.getDate();
    const month = next.getMonth() + 1;
    const dayOfWeek = next.getDay();

    if (
      parsed.minute.includes(minute) &&
      parsed.hour.includes(hour) &&
      parsed.day.includes(day) &&
      parsed.month.includes(month) &&
      parsed.dayOfWeek.includes(dayOfWeek)
    ) {
      return next;
    }

    next.setMinutes(next.getMinutes() + 1);
  }

  throw new Error("Could not find next run time within 1 year");
}

function shouldRunNow(expression: string): boolean {
  const parsed = parseCronExpression(expression);
  const now = new Date();
  const minute = now.getMinutes();
  const hour = now.getHours();
  const day = now.getDate();
  const month = now.getMonth() + 1;
  const dayOfWeek = now.getDay();

  return (
    parsed.minute.includes(minute) &&
    parsed.hour.includes(hour) &&
    parsed.day.includes(day) &&
    parsed.month.includes(month) &&
    parsed.dayOfWeek.includes(dayOfWeek)
  );
}

export interface SchedulerConfig {
  // Enable/disable all scheduling
  enabled: boolean;

  // Sync schedules (cron expressions)
  ecSyncSchedule: string; // Default: "0 2 * * *" (2 AM daily)
  certifierSyncSchedule: string; // Default: "0 3 * * *" (3 AM daily)
  centerSyncSchedule: string; // Default: "0 4 * * *" (4 AM daily)
  fullSyncSchedule: string; // Default: "0 1 * * 0" (1 AM every Sunday)

  // Maintenance schedules
  cleanupSchedule: string; // Default: "0 5 * * 0" (5 AM every Sunday)
}

const DEFAULT_CONFIG: SchedulerConfig = {
  enabled: true,
  ecSyncSchedule: "0 2 * * *", // 2 AM daily
  certifierSyncSchedule: "0 3 * * *", // 3 AM daily
  centerSyncSchedule: "0 4 * * *", // 4 AM daily
  fullSyncSchedule: "0 1 * * 0", // 1 AM every Sunday
  cleanupSchedule: "0 5 * * 0", // 5 AM every Sunday
};

export class SchedulerService {
  private prisma: PrismaClient;
  private syncService: RenecSyncService;
  private config: SchedulerConfig;
  private tasks: Map<string, ScheduledTask> = new Map();
  private intervalId: NodeJS.Timeout | null = null;
  private checkInterval = 60000; // Check every minute

  constructor(prisma: PrismaClient, config: Partial<SchedulerConfig> = {}) {
    this.prisma = prisma;
    this.syncService = new RenecSyncService(prisma);
    this.config = { ...DEFAULT_CONFIG, ...config };

    this.initializeTasks();
  }

  private initializeTasks(): void {
    // EC Standards sync
    this.tasks.set("ec-sync", {
      name: "RENEC EC Standards Sync",
      schedule: this.config.ecSyncSchedule,
      fn: async () => {
        console.log("[Scheduler] Starting EC Standards sync...");
        const result = await this.syncService.syncECStandards();
        console.log(`[Scheduler] EC sync complete: ${result.itemsProcessed} processed`);
      },
      enabled: this.config.enabled,
      running: false,
    });

    // Certifiers sync
    this.tasks.set("certifier-sync", {
      name: "RENEC Certifiers Sync",
      schedule: this.config.certifierSyncSchedule,
      fn: async () => {
        console.log("[Scheduler] Starting Certifiers sync...");
        const result = await this.syncService.syncCertifiers();
        console.log(
          `[Scheduler] Certifiers sync complete: ${result.itemsProcessed} processed`,
        );
      },
      enabled: this.config.enabled,
      running: false,
    });

    // Centers sync
    this.tasks.set("center-sync", {
      name: "RENEC Centers Sync",
      schedule: this.config.centerSyncSchedule,
      fn: async () => {
        console.log("[Scheduler] Starting Centers sync...");
        const result = await this.syncService.syncCenters();
        console.log(`[Scheduler] Centers sync complete: ${result.itemsProcessed} processed`);
      },
      enabled: this.config.enabled,
      running: false,
    });

    // Full sync (weekly)
    this.tasks.set("full-sync", {
      name: "RENEC Full Sync",
      schedule: this.config.fullSyncSchedule,
      fn: async () => {
        console.log("[Scheduler] Starting full RENEC sync...");
        const results = await this.syncService.syncAll();
        console.log("[Scheduler] Full sync complete:", results);
      },
      enabled: this.config.enabled,
      running: false,
    });

    // Cleanup old sync jobs (weekly)
    this.tasks.set("cleanup", {
      name: "Sync Job Cleanup",
      schedule: this.config.cleanupSchedule,
      fn: async () => {
        console.log("[Scheduler] Running cleanup...");
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const deleted = await this.prisma.renecSyncJob.deleteMany({
          where: {
            status: "COMPLETED",
            completedAt: { lt: thirtyDaysAgo },
          },
        });

        console.log(`[Scheduler] Cleanup complete: ${deleted.count} old jobs deleted`);
      },
      enabled: this.config.enabled,
      running: false,
    });

    // Calculate initial next run times
    for (const [, task] of this.tasks) {
      task.nextRun = getNextRunTime(task.schedule);
    }
  }

  /**
   * Start the scheduler
   */
  start(): void {
    if (this.intervalId) {
      console.warn("[Scheduler] Already running");
      return;
    }

    if (!this.config.enabled) {
      console.log("[Scheduler] Disabled by configuration");
      return;
    }

    console.log("[Scheduler] Starting scheduler with tasks:");
    for (const [name, task] of this.tasks) {
      console.log(`  - ${name}: ${task.schedule} (next: ${task.nextRun?.toISOString()})`);
    }

    // Check every minute
    this.intervalId = setInterval(() => this.checkAndRunTasks(), this.checkInterval);

    // Run initial check
    this.checkAndRunTasks();
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log("[Scheduler] Stopped");
    }
  }

  /**
   * Check if any tasks should run and execute them
   */
  private async checkAndRunTasks(): Promise<void> {
    for (const [name, task] of this.tasks) {
      if (!task.enabled || task.running) {
        continue;
      }

      if (shouldRunNow(task.schedule)) {
        task.running = true;
        task.lastRun = new Date();

        try {
          await task.fn();
        } catch (error) {
          console.error(`[Scheduler] Task ${name} failed:`, error);
        } finally {
          task.running = false;
          task.nextRun = getNextRunTime(task.schedule);
        }
      }
    }
  }

  /**
   * Manually trigger a specific task
   */
  async runTask(taskName: string): Promise<void> {
    const task = this.tasks.get(taskName);
    if (!task) {
      throw new Error(`Task not found: ${taskName}`);
    }

    if (task.running) {
      throw new Error(`Task ${taskName} is already running`);
    }

    task.running = true;
    task.lastRun = new Date();

    try {
      await task.fn();
    } finally {
      task.running = false;
      task.nextRun = getNextRunTime(task.schedule);
    }
  }

  /**
   * Get status of all tasks
   */
  getStatus(): Array<{
    name: string;
    displayName: string;
    schedule: string;
    enabled: boolean;
    running: boolean;
    lastRun: Date | undefined;
    nextRun: Date | undefined;
  }> {
    const statuses = [];
    for (const [name, task] of this.tasks) {
      statuses.push({
        name,
        displayName: task.name,
        schedule: task.schedule,
        enabled: task.enabled,
        running: task.running,
        lastRun: task.lastRun,
        nextRun: task.nextRun,
      });
    }
    return statuses;
  }

  /**
   * Enable or disable a specific task
   */
  setTaskEnabled(taskName: string, enabled: boolean): void {
    const task = this.tasks.get(taskName);
    if (task) {
      task.enabled = enabled;
    }
  }

  /**
   * Update task schedule
   */
  setTaskSchedule(taskName: string, schedule: string): void {
    const task = this.tasks.get(taskName);
    if (task) {
      // Validate the expression
      parseCronExpression(schedule);
      task.schedule = schedule;
      task.nextRun = getNextRunTime(schedule);
    }
  }
}

// Export a factory function for creating the scheduler
export function createScheduler(
  prisma: PrismaClient,
  config?: Partial<SchedulerConfig>,
): SchedulerService {
  return new SchedulerService(prisma, config);
}
