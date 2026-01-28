# Photobooth événementiel (monorepo)

Application web complète pour photobooth événementiel, avec :
- **Webapp** (Next.js App Router) pour booth/screen/admin.
- **Print server** local Node.js pour impression 10x15 cm.

## Prérequis
- Node.js 18+
- PostgreSQL 14+
- Accès S3 compatible (MinIO, Wasabi, AWS S3…)
- Imprimante locale installée sur la machine du print server

## Structure
```
apps/
  webapp/        # Next.js + Prisma + Socket.IO
  print-server/  # Express + PDF print
```

## Variables d’environnement
### Webapp (`apps/webapp/.env`)
Voir `apps/webapp/.env.example`.
- **ADMIN_PASSWORD** doit être un **hash bcrypt** (voir `prisma/seed.ts`).
- **S3_PUBLIC_BASE_URL** optionnel si bucket public.
- **SIGNED_URLS_ENABLED** : `true` pour générer des URLs signées.

### Print server (`apps/print-server/.env`)
Voir `apps/print-server/.env.example`.

## Installation
```bash
npm install
```

## Base de données
```bash
npm run migrate
npm run seed
```

## Lancer en local
### Webapp
```bash
npm run dev
```

### Print server
```bash
npm run print-server
```

## Déployer la webapp
```bash
npm run build
npm run start
```

## Config réseau événementiel
- Héberger la webapp et le print server sur la même machine.
- Créer un réseau local dédié (routeur) pour les tablettes/TV.
- Utiliser `PRINT_SERVER_URL` pointant vers l’IP LAN du print server.

## Endpoints clés
### API Admin
- `POST /api/admin/login` : login admin.
- `GET /api/admin/projects` : liste projets.
- `POST /api/admin/projects` : création projet.
- `GET /api/admin/projects/[slug]` : détail projet.
- `PUT /api/admin/projects/[slug]` : mise à jour projet.
- `POST /api/admin/projects/[slug]/backgrounds` : ajoute un décor.
- `POST /api/admin/uploads` : URL signée d’upload asset.

### API Booth
- `GET /api/projects/[slug]` : projet + décors publics.
- `POST /api/photos` : upload photo finale + création DB.
- `GET /api/photos?slug=` : liste photos publiques (screen).
- `POST /api/print` : envoi job d’impression.

### Print server
- `POST /jobs` : crée un job d’impression.
- `GET /jobs/:id` : statut d’un job.
- `GET /health` : healthcheck.

## Notes d’usage
- Le booth compose l’image finale via Canvas (photo + décor + logo + message).
- Les photos publiques sont diffusées en temps réel via Socket.IO.
- Les photos non publiques ne sont jamais envoyées au screen.

## Scripts disponibles
- `npm run dev` : webapp en dev.
- `npm run build` : build webapp.
- `npm run start` : serve webapp.
- `npm run migrate` : migrations Prisma.
- `npm run seed` : seed de base.
- `npm run print-server` : lancer serveur d’impression.
