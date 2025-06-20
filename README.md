# Threesby Monorepo

This project has been restructured into a monorepo containing both the web application and mobile application, along with shared utilities.

## Project Structure

```
threesby/
├── apps/
│   ├── web/          # React web application
│   └── mobile/       # React Native mobile application
├── shared/           # Shared utilities, types, and configurations
│   ├── lib/         # Shared libraries (Supabase, utils)
│   ├── types/       # TypeScript type definitions
│   └── supabase/    # Supabase migrations and config
├── package.json     # Root workspace configuration
└── README.md
```

## Getting Started

### Installation

```bash
# Install all dependencies for all workspaces
npm install
```

### Development

#### Web Application
```bash
# Start web development server
npm run dev:web

# Build web application
npm run build:web
```

#### Mobile Application
```bash
# Start Expo development server
npm run dev:mobile

# Or navigate to the mobile app directly
cd apps/mobile
npx expo start
```

### Workspace Commands

```bash
# Run commands across all workspaces
npm run lint
npm run type-check

# Install dependencies in specific workspace
npm install --workspace=@threesby/web [package-name]
npm install --workspace=@threesby/mobile [package-name]
```

## Benefits of This Structure

1. **Code Sharing**: Shared utilities and types between web and mobile
2. **Consistent Dependencies**: Centralized package management
3. **Single Repository**: One git repo, one IDE workspace
4. **No Routing Conflicts**: Clear separation between platforms
5. **Easy Development**: Switch between web and mobile development seamlessly

## Workspace Packages

- `@threesby/web` - React web application
- `@threesby/mobile` - React Native mobile application  
- `@threesby/shared` - Shared utilities and types

## Next Steps

1. Remove old duplicate project folders:
   - `ThreesbyApp/`
   - `ThreesbyMobile/`
   - `ThreesbyNative/`
   
2. Install dependencies: `npm install`

3. Test both applications:
   - Web: `npm run dev:web`
   - Mobile: `npm run dev:mobile`

4. Configure shared imports in mobile app to use `@threesby/shared`

## Migration Notes

- Web application moved from root to `apps/web/`
- Mobile application consolidated from `ThreesbyApp/` to `apps/mobile/`
- Shared code extracted to `shared/` for reuse
- All package.json files updated for workspace structure 