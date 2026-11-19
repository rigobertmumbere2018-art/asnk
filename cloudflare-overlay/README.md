# Cloudflare-native backend overlay

The build extracts the legacy UI archive, then copies this overlay into the app. API endpoints are served by the Worker and persist data in D1. Supabase is not needed by these backend endpoints.