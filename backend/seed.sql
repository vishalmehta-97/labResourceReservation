USE lab_reservation_db;

-- 1. Default Admin User (password: Admin@1234)
INSERT INTO users (name, email, password_hash, role) VALUES
('System Administrator', 'admin@labreserve.edu', '$2a$10$JOIu339G6pOre6BX/0MMBexjOFvMnireg/.m8xaA2RwZqEUVjQrfq', 'ADMIN')
ON DUPLICATE KEY UPDATE 
  name = VALUES(name),
  password_hash = VALUES(password_hash),
  role = VALUES(role);

-- 2. Sample Regular Users (password: User@1234)
INSERT INTO users (name, email, password_hash, role) VALUES
('Alice Johnson', 'alice@student.edu', '$2a$10$TLaslbmzGyM/ZfPRGy0YUergO/y3zuHZEEB.UTwn0CDjLTkXySQPa', 'USER'),
('Bob Smith', 'bob@student.edu', '$2a$10$TLaslbmzGyM/ZfPRGy0YUergO/y3zuHZEEB.UTwn0CDjLTkXySQPa', 'USER')
ON DUPLICATE KEY UPDATE 
  name = VALUES(name),
  password_hash = VALUES(password_hash),
  role = VALUES(role);

-- 3. Sample Equipment
INSERT INTO equipment (name, serial_number, category, lab_location, status, description) VALUES
('Oscilloscope Tektronix TDS2024C', 'TDS2024C-001', 'Electronics', 'Electronics Lab - Room 101', 'AVAILABLE', '200 MHz, 4-channel digital storage oscilloscope. Suitable for signal analysis and circuit debugging.'),
('Oscilloscope Tektronix TDS2024C', 'TDS2024C-002', 'Electronics', 'Electronics Lab - Room 101', 'AVAILABLE', '200 MHz, 4-channel digital storage oscilloscope. Second unit for parallel experiments.'),
('Arduino Mega 2560 Kit', 'ARD-MEGA-001', 'Microcontroller', 'Embedded Systems Lab - Room 203', 'AVAILABLE', 'Complete Arduino Mega 2560 kit with breadboard, jumper wires, sensors, and actuators.'),
('Arduino Mega 2560 Kit', 'ARD-MEGA-002', 'Microcontroller', 'Embedded Systems Lab - Room 203', 'AVAILABLE', 'Complete Arduino Mega 2560 kit with breadboard, jumper wires, sensors, and actuators.'),
('Raspberry Pi 4 Model B (8GB)', 'RPI4-8GB-001', 'Single Board Computer', 'IoT Lab - Room 205', 'AVAILABLE', 'Raspberry Pi 4 with 8GB RAM, pre-loaded with Raspberry Pi OS. Includes power supply and case.'),
('Raspberry Pi 4 Model B (8GB)', 'RPI4-8GB-002', 'Single Board Computer', 'IoT Lab - Room 205', 'AVAILABLE', 'Raspberry Pi 4 with 8GB RAM, pre-loaded with Raspberry Pi OS. Includes power supply and case.'),
('Digital Multimeter Fluke 87V', 'FLUKE-87V-001', 'Measurement', 'Electronics Lab - Room 101', 'AVAILABLE', 'True-RMS digital multimeter with 1000V CAT III / 600V CAT IV safety rating. Measures AC/DC voltage, current, resistance, capacitance, and temperature.'),
('Digital Multimeter Fluke 87V', 'FLUKE-87V-002', 'Measurement', 'Electronics Lab - Room 101', 'AVAILABLE', 'True-RMS digital multimeter with 1000V CAT III / 600V CAT IV safety rating.'),
('Soldering Station Hakko FX-888D', 'HAKKO-888D-001', 'Workshop Tool', 'PCB Lab - Room 102', 'AVAILABLE', 'Digital precision soldering station with temperature control (200-480°C). Includes multiple tip options.'),
('Function Generator Rigol DG1032Z', 'RIGOL-DG1032Z-001', 'Signal Generator', 'Electronics Lab - Room 101', 'AVAILABLE', 'Dual-channel function/arbitrary waveform generator, 30MHz bandwidth, 200MSa/s sample rate.'),
('Logic Analyzer Saleae Logic 8', 'SALEAE-L8-001', 'Electronics', 'Embedded Systems Lab - Room 203', 'AVAILABLE', '8-channel USB logic analyzer supporting protocols: SPI, I2C, UART, CAN, USB, and more.'),
('3D Printer Creality Ender 3 Pro', 'ENDER3PRO-001', '3D Printing', 'Fabrication Lab - Room 301', 'AVAILABLE', 'FDM 3D printer with 220x220x250mm build volume. Supports PLA, ABS, PETG filaments.'),
('Network Packet Analyzer (Wireshark Station)', 'WIRESHARK-PC-001', 'Networking', 'Network Lab - Room 304', 'AVAILABLE', 'Dedicated PC with Wireshark, tcpdump, and network analysis tools. Connected to isolated lab network.'),
('Power Supply Rigol DP832', 'RIGOL-DP832-001', 'Power Equipment', 'Electronics Lab - Room 101', 'MAINTENANCE', 'Triple-output programmable DC power supply. Currently undergoing calibration maintenance.'),
('FPGA Development Board Xilinx Artix-7', 'XILINX-A7-001', 'Digital Design', 'Digital Systems Lab - Room 202', 'AVAILABLE', 'Xilinx Artix-7 FPGA development board with 100K logic cells. Includes UART, SPI, I2C, and GPIO interfaces.')
ON DUPLICATE KEY UPDATE 
  name = VALUES(name),
  category = VALUES(category),
  lab_location = VALUES(lab_location),
  status = VALUES(status),
  description = VALUES(description);
