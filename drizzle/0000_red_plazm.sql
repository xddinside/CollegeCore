CREATE TABLE `assignments` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`subject_id` int unsigned NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`due_date` date,
	`status` enum('TODO','IN_PROGRESS','COMPLETED') NOT NULL DEFAULT 'TODO',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `assignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `attachments` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`assignment_id` int unsigned NOT NULL,
	`url` varchar(500) NOT NULL,
	`filename` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `attachments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `exam_sprints` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`semester_id` int unsigned NOT NULL,
	`name` varchar(100) NOT NULL,
	`start_date` date NOT NULL,
	`end_date` date NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `exam_sprints_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `semesters` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`user_id` varchar(255) NOT NULL,
	`name` varchar(100) NOT NULL,
	`is_current` boolean NOT NULL DEFAULT true,
	`is_archived` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `semesters_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sprint_sessions` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`sprint_id` int unsigned NOT NULL,
	`date` date NOT NULL,
	`start_time` time NOT NULL,
	`end_time` time NOT NULL,
	`subject_id` int unsigned NOT NULL,
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sprint_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subjects` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`semester_id` int unsigned NOT NULL,
	`name` varchar(100) NOT NULL,
	`color` varchar(7) NOT NULL DEFAULT '#6366f1',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `subjects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `todos` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`semester_id` int unsigned NOT NULL,
	`subject_id` int unsigned,
	`title` varchar(255) NOT NULL,
	`due_date` date,
	`is_completed` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `todos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`clerk_id` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_clerk_id` PRIMARY KEY(`clerk_id`)
);
--> statement-breakpoint
CREATE INDEX `semester_user_id_idx` ON `semesters` (`user_id`);