-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: ims_iot_document_kiosk
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `user_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `role_id` bigint(20) unsigned NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `middle_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `contact_number` varchar(20) DEFAULT NULL,
  `status` enum('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  `last_login` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `username` (`username`),
  KEY `idx_users_role` (`role_id`),
  KEY `idx_users_email` (`email`),
  CONSTRAINT `fk_users_role` FOREIGN KEY (`role_id`) REFERENCES `user_roles` (`role_id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (22,1,'Neil Andrei','ANDREI MADRID','Enrera','Admin1','$2b$10$uqlraFryDZp/zezzcbkc9ezki2SY8qBCbD1qb21.jxUmgUniHvtfm','andreienrera@gmail.com','09476141605','ACTIVE','2026-09-18 21:51:56','2026-08-19 08:20:56','2026-09-18 13:51:56'),(23,1,'Wien Allen','A','Reyes','Admin2','$2b$10$uqlraFryDZp/zezzcbkc9ezki2SY8qBCbD1qb21.jxUmgUniHvtfm','wienreyes@gmail.com','09123456789','ACTIVE','2026-08-21 17:35:53','2026-08-21 09:33:38','2026-09-03 16:27:36');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_roles`
--

DROP TABLE IF EXISTS `user_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_roles` (
  `role_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `role_name` varchar(50) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`role_id`),
  UNIQUE KEY `role_name` (`role_name`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_roles`
--

LOCK TABLES `user_roles` WRITE;
/*!40000 ALTER TABLE `user_roles` DISABLE KEYS */;
INSERT INTO `user_roles` VALUES (1,'Administrator','System Administrator',1,'2026-07-29 05:27:50','2026-07-29 05:27:50'),(2,'Barangay Secretary','Processes document requests',1,'2026-07-29 05:27:50','2026-07-29 05:27:50'),(4,'Barangay Captain','Approves requests',1,'2026-07-29 05:27:50','2026-07-29 05:27:50'),(5,'Staff','General staff member',1,'2026-07-30 14:22:53','2026-07-30 14:22:53');
/*!40000 ALTER TABLE `user_roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `services`
--

DROP TABLE IF EXISTS `services`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `services` (
  `service_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `service_name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `requirements` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`requirements`)),
  `form_fields` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`form_fields`)),
  `processing_fee` decimal(10,2) DEFAULT 0.00,
  `requires_photo` tinyint(1) DEFAULT 0,
  `can_combine_with_others` tinyint(1) DEFAULT 1,
  `allow_multiple_active_requests` tinyint(1) DEFAULT 0,
  `allow_new_request_after_release` tinyint(1) DEFAULT 1,
  `is_active` tinyint(1) DEFAULT 1,
  `template_path` varchar(255) DEFAULT NULL,
  `template_original_name` varchar(255) DEFAULT NULL,
  `template_mime` varchar(100) DEFAULT NULL,
  `template_size` bigint(20) DEFAULT NULL,
  `document_mappings` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`document_mappings`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`service_id`),
  UNIQUE KEY `service_name` (`service_name`)
) ENGINE=InnoDB AUTO_INCREMENT=73 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `services`
--

LOCK TABLES `services` WRITE;
/*!40000 ALTER TABLE `services` DISABLE KEYS */;
INSERT INTO `services` VALUES (41,'CERTIFICATE OF INDIGENCY','An official document certifying that an individual or family has limited financial means and may qualify for government assistance and other benefits.','[\"Valid ID\",\"HOA Certificate\"]','[{\"key\":\"purpose\",\"label\":\"Purpose of request\",\"type\":\"text\",\"required\":true,\"placeholder\":\"Purpose\"},{\"key\":\"relative_name\",\"label\":\"Name of relative/beneficiary\",\"type\":\"text\",\"required\":true,\"placeholder\":\"Name of relative\"},{\"key\":\"Block\",\"label\":\"block\",\"type\":\"text\",\"required\":true,\"placeholder\":\"Block\"},{\"key\":\"lot\",\"label\":\"Lot\",\"type\":\"text\",\"required\":true,\"placeholder\":\"Lot\"},{\"key\":\"Subdivision\",\"label\":\"subdivision\",\"type\":\"text\",\"required\":true,\"placeholder\":\"Subdivision\"}]',100.00,0,1,0,1,1,'templates/b859aef560ec92bf0fe03b4a4a7b2b24.docx','Dummy_Certificate_Colored_Template.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document',27438,'[{\"placeholder\":\"full_name\",\"source\":\"resident\",\"field\":\"full_name\"},{\"placeholder\":\"age\",\"source\":\"resident\",\"field\":\"age\"},{\"placeholder\":\"civil_status\",\"source\":\"resident\",\"field\":\"civil_status\"},{\"placeholder\":\"block\",\"source\":\"application\",\"field\":\"Block\"},{\"placeholder\":\"lot\",\"source\":\"application\",\"field\":\"lot\"},{\"placeholder\":\"street\",\"source\":\"resident\",\"field\":\"street\"},{\"placeholder\":\"subdivision\",\"source\":\"application\",\"field\":\"Subdivision\"},{\"placeholder\":\"relative_name\",\"source\":\"application\",\"field\":\"relative_name\"},{\"placeholder\":\"purpose\",\"source\":\"application\",\"field\":\"purpose\"},{\"placeholder\":\"day\",\"source\":\"system\",\"field\":\"day\"},{\"placeholder\":\"month\",\"source\":\"system\",\"field\":\"month\"},{\"placeholder\":\"year\",\"source\":\"system\",\"field\":\"year\"}]','2026-08-06 11:03:49','2026-09-03 17:47:40'),(68,'Barangay Clearance','Official Barangay Clearance for employment, valid ID applications, postal ID, and government transactions.','[\"Valid ID\",\"Proof of Residency\"]','[{\"key\":\"purpose\",\"label\":\"Purpose of Request\",\"type\":\"select\",\"required\":true,\"options\":[\"Local Employment\",\"Overseas Employment\",\"Bank Account Opening\",\"Postal ID\",\"Police Clearance\",\"NBI Clearance\",\"Business Permit\",\"School Requirement\",\"Other\"]},{\"key\":\"block\",\"label\":\"Block No.\",\"type\":\"text\",\"required\":true,\"placeholder\":\"e.g., Block 5\"},{\"key\":\"lot\",\"label\":\"Lot No.\",\"type\":\"text\",\"required\":true,\"placeholder\":\"e.g., Lot 12\"},{\"key\":\"street\",\"label\":\"Street\",\"type\":\"text\",\"required\":true,\"placeholder\":\"e.g., Mabini Street\"},{\"key\":\"subdivision\",\"label\":\"Subdivision\",\"type\":\"text\",\"required\":true,\"placeholder\":\"e.g., Villa San Manuel\"}]',100.00,0,1,0,1,1,'templates/cdb4900fdc08fad0a3fae411483cef11.docx','Barangay-San-Manuel-Clearance-Template (1).docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document',25269,'[{\"placeholder\":\"full_name\",\"source\":\"resident\",\"field\":\"full_name\"},{\"placeholder\":\"age\",\"source\":\"resident\",\"field\":\"age\"},{\"placeholder\":\"block\",\"source\":\"application\",\"field\":\"block\"},{\"placeholder\":\"lot\",\"source\":\"application\",\"field\":\"lot\"},{\"placeholder\":\"street\",\"source\":\"application\",\"field\":\"street\"},{\"placeholder\":\"subdivision\",\"source\":\"application\",\"field\":\"subdivision\"},{\"placeholder\":\"purpose\",\"source\":\"application\",\"field\":\"purpose\"},{\"placeholder\":\"day\",\"source\":\"system\",\"field\":\"day\"},{\"placeholder\":\"month\",\"source\":\"system\",\"field\":\"month\"},{\"placeholder\":\"year\",\"source\":\"system\",\"field\":\"year\"},{\"placeholder\":\"control_number\",\"source\":\"system\",\"field\":\"request_number\"}]','2026-08-25 21:21:02','2026-09-03 08:49:14'),(69,'Barangay ID','Official Barangay Identification Card','[\"Birth Certificate or Valid ID\",\"Proof of Residency\"]','[{\"key\":\"full_name\",\"label\":\"Full Name\",\"type\":\"text\",\"required\":true,\"placeholder\":\"Full Name\"},{\"key\":\"place_of_birth\",\"label\":\"Place of Birth\",\"type\":\"text\",\"required\":true,\"placeholder\":\"e.g. San Jose, Antique\"},{\"key\":\"birth_date\",\"label\":\"Birth Date\",\"type\":\"date\",\"required\":true},{\"key\":\"address\",\"label\":\"Complete Address\",\"type\":\"text\",\"required\":true,\"placeholder\":\"Block, Lot, Street, Subdivision\"},{\"key\":\"gender\",\"label\":\"Gender\",\"type\":\"select\",\"required\":true,\"options\":[\"Male\",\"Female\",\"Other\"]},{\"key\":\"civil_status\",\"label\":\"Civil Status\",\"type\":\"select\",\"required\":true,\"options\":[\"Single\",\"Married\",\"Widowed\",\"Separated\"]},{\"key\":\"emergency_contact_name\",\"label\":\"Emergency Contact Person\",\"type\":\"text\",\"required\":true,\"placeholder\":\"Contact Person Name\"},{\"key\":\"emergency_contact_number\",\"label\":\"Emergency Contact Number\",\"type\":\"tel\",\"required\":true,\"placeholder\":\"09xxxxxxxxx\"}]',150.00,1,1,0,1,1,'templates/Barangay-San-Manuel-ID-Template-Dummy.docx','Barangay-San-Manuel-ID-Template-Dummy.docx','application/vnd.openxmlformats-officedocument.wordprocessingml.document',38653,'[{\"placeholder\":\"resident_photo\",\"source\":\"application\",\"field\":\"photo\"},{\"placeholder\":\"full_name\",\"source\":\"application\",\"field\":\"full_name\"},{\"placeholder\":\"place_of_birth\",\"source\":\"application\",\"field\":\"place_of_birth\"},{\"placeholder\":\"date_of_birth\",\"source\":\"application\",\"field\":\"birth_date\"},{\"placeholder\":\"address\",\"source\":\"application\",\"field\":\"address\"},{\"placeholder\":\"id_number\",\"source\":\"system\",\"field\":\"request_number\"},{\"placeholder\":\"date_issued\",\"source\":\"system\",\"field\":\"current_date\"},{\"placeholder\":\"valid_until\",\"source\":\"system\",\"field\":\"current_date\"},{\"placeholder\":\"civil_status\",\"source\":\"application\",\"field\":\"civil_status\"},{\"placeholder\":\"emergency_contact_name\",\"source\":\"application\",\"field\":\"emergency_contact_name\"},{\"placeholder\":\"emergency_contact_number\",\"source\":\"application\",\"field\":\"emergency_contact_number\"},{\"placeholder\":\"gender\",\"source\":\"application\",\"field\":\"gender\"}]','2026-08-25 21:48:44','2026-09-10 15:42:37');
/*!40000 ALTER TABLE `services` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-19 19:14:53
