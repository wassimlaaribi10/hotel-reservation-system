-- Création des tables
-- =====================================================

-- Table users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('receptionist', 'admin')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table clients
CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    id_card_number VARCHAR(20) UNIQUE NOT NULL,
    address TEXT,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table rooms
CREATE TABLE rooms (
    id SERIAL PRIMARY KEY,
    room_number VARCHAR(10) UNIQUE NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('single', 'double', 'suite')),
    floor INTEGER NOT NULL,
    capacity INTEGER NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

-- Table equipment
CREATE TABLE equipment (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

-- Table de liaison room_equipment
CREATE TABLE room_equipment (
    room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
    equipment_id INTEGER REFERENCES equipment(id) ON DELETE CASCADE,
    PRIMARY KEY (room_id, equipment_id)
);

-- Table seasonal_prices
CREATE TABLE seasonal_prices (
    id SERIAL PRIMARY KEY,
    room_type VARCHAR(20) NOT NULL CHECK (room_type IN ('single', 'double', 'suite')),
    season_name VARCHAR(20) NOT NULL CHECK (season_name IN ('high', 'low', 'special')),
    price_per_night DECIMAL(10,2) NOT NULL,
    valid_from DATE,
    valid_to DATE
);

-- Table reservations
CREATE TABLE reservations (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    number_of_guests INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled')),
    total_price DECIMAL(10,2),
    discount_percent DECIMAL(5,2) DEFAULT 0,
    cancelled_at TIMESTAMP,
    cancellation_fee DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    checked_in_at TIMESTAMP,
    checked_out_at TIMESTAMP
);

-- Table invoices
CREATE TABLE invoices (
    id SERIAL PRIMARY KEY,
    reservation_id INTEGER REFERENCES reservations(id) ON DELETE CASCADE,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    issue_date DATE NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    discount DECIMAL(10,2) DEFAULT 0,
    final_amount DECIMAL(10,2) NOT NULL,
    pdf_path TEXT,
    details JSONB
);

-- =====================================================
-- Données de test (INSERT)
-- =====================================================

-- clients
INSERT INTO clients (first_name, last_name, id_card_number, address, phone, email, is_active) VALUES
('Jean', 'Dupont', 'JD123', '12 rue de Paris, 75001 Paris', '0612345678', 'jean.dupont@email.com', true),
('Marie', 'Curie', 'MC456', '5 avenue des Sciences, 75005 Paris', '0698765432', 'marie.curie@email.com', true),
('Sophie', 'Martin', 'SM789', '22 boulevard Victor Hugo, 13006 Marseille', '0678901234', 'sophie.martin@email.com', true),
('Lucas', 'Bernard', 'LB321', '8 place de la République, 69002 Lyon', '0654321098', 'lucas.bernard@email.com', true);

-- Chambres
INSERT INTO rooms (room_number, type, floor, capacity, description, is_active) VALUES
('101', 'single', 1, 2, 'Chambre confortable avec vue sur jardin', true),
('102', 'double', 1, 4, 'Chambre spacieuse, idéale pour famille', true),
('201', 'suite', 2, 4, 'Suite luxueuse avec salon séparé', true),
('202', 'single', 2, 2, 'Chambre calme avec bureau', true);

-- Équipements
INSERT INTO equipment (name) VALUES
('Climatisation'),
('Wi-Fi'),
('Mini-bar'),
('Vue mer'),
('Balcon');

-- Associations chambre ↔ équipement
INSERT INTO room_equipment (room_id, equipment_id) VALUES
(1,1), (1,2), (1,3),   -- 101: Clim, Wi-Fi, Mini-bar
(2,1), (2,2), (2,4),   -- 102: Clim, Wi-Fi, Vue mer
(3,1), (3,2), (3,3), (3,4), (3,5), -- 201: tout
(4,1), (4,2);          -- 202: Clim, Wi-Fi

-- Tarifs saisonniers
INSERT INTO seasonal_prices (room_type, season_name, price_per_night, valid_from, valid_to) VALUES
('single', 'low', 80, '2025-01-01', '2025-04-30'),
('single', 'high', 150, '2025-07-01', '2025-08-31'),
('double', 'low', 120, '2025-01-01', '2025-04-30'),
('double', 'high', 220, '2025-07-01', '2025-08-31'),
('suite', 'low', 180, '2025-01-01', '2025-04-30'),
('suite', 'high', 350, '2025-07-01', '2025-08-31');

-- Réservations
-- Réservation 1 (Jean Dupont, chambre 101, check‑in anticipé effectué)
INSERT INTO reservations (client_id, room_id, check_in_date, check_out_date, number_of_guests, status, total_price, discount_percent, checked_in_at) VALUES
(1, 1, '2026-06-10', '2026-06-15', 2, 'checked_in', 750, 0, CURRENT_TIMESTAMP);

-- Réservation 2 (Marie Curie, chambre 102, confirmée avec remise 10%)
INSERT INTO reservations (client_id, room_id, check_in_date, check_out_date, number_of_guests, status, total_price, discount_percent) VALUES
(2, 2, '2026-07-15', '2026-07-20', 3, 'confirmed', 1100, 10);

-- Réservation 3 (Sophie Martin, chambre 201, check‑out effectué, facture générée)
INSERT INTO reservations (client_id, room_id, check_in_date, check_out_date, number_of_guests, status, total_price, discount_percent, checked_in_at, checked_out_at) VALUES
(3, 3, '2026-05-20', '2026-05-25', 2, 'checked_out', 1750, 0, '2026-05-20 14:30:00', '2026-05-25 11:00:00');

-- Réservation 4 (Lucas Bernard, chambre 202, annulée avec pénalité)
INSERT INTO reservations (client_id, room_id, check_in_date, check_out_date, number_of_guests, status, total_price, discount_percent, cancellation_fee) VALUES
(4, 4, '2026-06-05', '2026-06-07', 1, 'cancelled', 160, 0, 48);

-- Facture pour la réservation 3
INSERT INTO invoices (reservation_id, invoice_number, issue_date, total_amount, discount, final_amount, details) VALUES
(3, 'INV-2026-00001', '2026-05-25', 1750, 0, 1750, '[
  {"date":"2026-05-20","price":350,"roomType":"suite","roomNumber":"201"},
  {"date":"2026-05-21","price":350,"roomType":"suite","roomNumber":"201"},
  {"date":"2026-05-22","price":350,"roomType":"suite","roomNumber":"201"},
  {"date":"2026-05-23","price":350,"roomType":"suite","roomNumber":"201"},
  {"date":"2026-05-24","price":350,"roomType":"suite","roomNumber":"201"}
]');
