CREATE TABLE `auditLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`repairId` int NOT NULL,
	`userId` int NOT NULL,
	`action` varchar(100) NOT NULL,
	`fieldChanged` varchar(100),
	`oldValue` text,
	`newValue` text,
	`details` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`phone` varchar(20) NOT NULL,
	`email` varchar(320),
	`city` varchar(100),
	`address` text,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inventory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`partName` varchar(255) NOT NULL,
	`partCode` varchar(100),
	`quantity` int NOT NULL DEFAULT 0,
	`minimumStock` int NOT NULL DEFAULT 5,
	`unitPrice` decimal(10,2) NOT NULL,
	`supplier` varchar(255),
	`category` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inventory_id` PRIMARY KEY(`id`),
	CONSTRAINT `inventory_partCode_unique` UNIQUE(`partCode`)
);
--> statement-breakpoint
CREATE TABLE `repairParts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`repairId` int NOT NULL,
	`partId` int NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`unitPrice` decimal(10,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `repairParts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `repairs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`repairNumber` varchar(50) NOT NULL,
	`customerId` int NOT NULL,
	`technicianId` int,
	`deviceModel` varchar(255) NOT NULL,
	`imei` varchar(50) NOT NULL,
	`phoneNumber` varchar(20) NOT NULL,
	`city` varchar(100),
	`complaint` text NOT NULL,
	`repairType` enum('software','hardware','both') NOT NULL,
	`financialService` enum('cash','loan') NOT NULL,
	`warrantyStatus` enum('in_warranty','out_of_warranty') NOT NULL,
	`status` enum('open','in_progress','waiting_parts','quality_check','completed','returned','cancelled') NOT NULL DEFAULT 'open',
	`solution` text,
	`cost` decimal(10,2),
	`remarks` text,
	`photoFront` varchar(500),
	`photoBack` varchar(500),
	`photoRepair` varchar(500),
	`photoFinalQA` varchar(500),
	`dateReceived` datetime NOT NULL,
	`dateCompleted` datetime,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `repairs_id` PRIMARY KEY(`id`),
	CONSTRAINT `repairs_repairNumber_unique` UNIQUE(`repairNumber`),
	CONSTRAINT `repairs_imei_unique` UNIQUE(`imei`)
);
--> statement-breakpoint
CREATE TABLE `statusHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`repairId` int NOT NULL,
	`previousStatus` enum('open','in_progress','waiting_parts','quality_check','completed','returned','cancelled'),
	`newStatus` enum('open','in_progress','waiting_parts','quality_check','completed','returned','cancelled') NOT NULL,
	`changedBy` int NOT NULL,
	`reason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `statusHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `technicians` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320),
	`phone` varchar(20),
	`specialization` varchar(255),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `technicians_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('admin','technician','viewer') NOT NULL DEFAULT 'viewer',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
CREATE TABLE `warrantyAlerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`repairId` int NOT NULL,
	`expiryDate` datetime NOT NULL,
	`isNotified` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `warrantyAlerts_id` PRIMARY KEY(`id`)
);
