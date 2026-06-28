# Book Scanner

A web application for scanning ISBN barcodes, fetching book metadata, organizing books into groups,
and generating QR code labels.

## Features

### Current Functionality

- **Camera-Based ISBN Scanning**: Access your device's camera to scan ISBN barcodes from books
- **Manual ISBN Entry**: Type or paste ISBNs directly if camera scanning isn't available
- **Book Data Fetching**: Automatically retrieves book title and author information from:
  - OpenLibrary Books API (primary)
  - Google Books API (fallback)
- **Group Management**: Organize scanned books into custom groups
- **QR Code Label Generation**: Generate printable QR code labels for each group that link back to
  view the group's contents
- **Data Persistence**: Persists books and groups to a self-hosted Postgres database through the app server
- **Inventory Fields**: Track user-selected condition and format for each scanned book
- **Export/Import**: Export your data as JSON or import previously exported data

## How It Works

1. **Scan or Enter ISBN**: Use the camera scanner or manually enter an ISBN
2. **Fetch Book Data**: The app automatically looks up the book's title and author information
3. **Organize into Groups**: Assign books to groups for better organization
4. **Generate Labels**: Create QR code labels that can be printed and scanned to view group contents

## Technology Stack

- **React 19** with TypeScript
- **Vite** for client build tooling
- **Hono** for the server API
- **Clerk** for authentication
- **Postgres + Drizzle ORM** for persistence
- **TanStack Query** for data fetching and caching
- **TanStack Router** for routing
- **ZXing** for barcode scanning
- **QRCode** library for QR code generation

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- pnpm
- Docker
- Clerk application keys

### Installation

```bash
pnpm install
```

### Development

```bash
docker compose up -d postgres
pnpm db:migrate
pnpm dev
```

The client runs at `http://localhost:5173` and the server runs at `http://localhost:8787`.
Copy `.env.example`, `client/.env.example`, and `server/.env.example` before starting.

### Building for Production

```bash
pnpm build
```

The built client files will be in `client/dist/`.

## Projected Roadmap

### Phase 1: Self-Hosted Persistence

- **Database Migration**: Store inventory in Postgres through the server API
  - Clerk authentication and multi-user support
  - Persistent storage across devices
- **Enhanced Features**:
  - User accounts and authentication
  - Cloud backup of book collections
  - Multi-device access
  - Condition and format tracking

### Phase 2: Catalog Improvements

- Better book condition workflows
- User-selected format defaults for fast scanning
- Search/filtering by group, condition, and format

### Phase 3: Marketplace Integration

- **eBay API Integration** (if possible):
  - List books directly to eBay from the app
  - Track listing status and sales
  - Sync inventory between app and eBay account
- **Amazon API Integration** (if possible):
  - List books on Amazon Marketplace
  - Manage listings and inventory
  - Price tracking and comparison

### Future Enhancements

- Bulk operations for managing multiple books
- Advanced search and filtering
- Price history tracking
- Sales analytics and reporting
- Mobile app version
- Barcode scanning improvements for damaged or difficult-to-scan books

## Notes

- Camera access requires HTTPS in production (or localhost for development)
- Marketplace integrations should call external seller APIs from the server only
- QR code labels link to a viewable group page that can be accessed from any device

## License

TBD
