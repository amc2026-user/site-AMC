import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";

const app = new Hono();
const HISTORY_KEY = "admin:history";
const HISTORY_RETENTION_MS = 3 * 24 * 60 * 60 * 1000;

const cleanupHistory = async () => {
  const history = await kv.get(HISTORY_KEY) || [];
  const limit = Date.now() - HISTORY_RETENTION_MS;
  const cleaned = history.filter((entry: any) => new Date(entry.createdAt).getTime() >= limit);
  if (cleaned.length !== history.length) await kv.set(HISTORY_KEY, cleaned);
  return cleaned;
};

const addHistory = async (actor: string, action: string, target: string, detail = "") => {
  const cleaned = await cleanupHistory();
  const entry = {
    id: crypto.randomUUID(),
    actor: actor?.trim() || "Inconnu",
    action,
    target,
    detail,
    createdAt: new Date().toISOString(),
  };
  await kv.set(HISTORY_KEY, [entry, ...cleaned].slice(0, 100));
};

app.use('*', logger(console.log));
app.use("/*", cors({
  origin: "*",
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  exposeHeaders: ["Content-Length"],
  maxAge: 600,
}));

app.get("/make-server-be42ff6e/health", (c) => c.json({ status: "ok" }));

app.get("/make-server-be42ff6e/history", async (c) => {
  try {
    const history = await cleanupHistory();
    return c.json(history);
  } catch (error) {
    console.log("Error fetching history:", error);
    return c.json({ error: `Erreur récupération de l'historique: ${error}` }, 500);
  }
});

app.get("/make-server-be42ff6e/offers", async (c) => {
  try {
    const offers = await kv.getByPrefix("offer:");
    offers.sort((a: any, b: any) => {
      const priorityDiff = (b.priority || 0) - (a.priority || 0);
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return c.json(offers);
  } catch (error) {
    console.log("Error fetching offers:", error);
    return c.json({ error: `Erreur rÃ©cupÃ©ration des offres: ${error}` }, 500);
  }
});

app.post("/make-server-be42ff6e/offers", async (c) => {
  try {
    const body = await c.req.json();
    const actor = body.actor || "Inconnu";
    const offer = {
      id: crypto.randomUUID(),
      title: body.title,
      description: body.description,
        badge: body.badge || "",
        imageUrl: body.imageUrl || "",
        validUntil: body.validUntil || "",
        priority: Number(body.priority) || 0,
        createdAt: new Date().toISOString(),
      };
    await kv.set(`offer:${offer.id}`, offer);
    await addHistory(actor, "Création", "Offre", offer.title);
    return c.json(offer, 201);
  } catch (error) {
    console.log("Error creating offer:", error);
    return c.json({ error: `Erreur crÃ©ation de l'offre: ${error}` }, 500);
  }
});

app.put("/make-server-be42ff6e/offers/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const existing = await kv.get(`offer:${id}`);
    if (!existing) return c.json({ error: "Offre introuvable" }, 404);
    const body = await c.req.json();
    const { actor, ...changes } = body;
    const updated = { ...existing, ...changes, id };
    await kv.set(`offer:${id}`, updated);
    await addHistory(actor || "Inconnu", "Modification", "Offre", updated.title || existing.title);
    return c.json(updated);
  } catch (error) {
    console.log("Error updating offer:", error);
    return c.json({ error: `Erreur mise Ã  jour de l'offre: ${error}` }, 500);
  }
});

app.delete("/make-server-be42ff6e/offers/:id", async (c) => {
  try {
    const id = c.req.param("id");
    let actor = "Inconnu";
    try {
      const body = await c.req.json();
      actor = body.actor || actor;
    } catch (_error) {}
    const existing = await kv.get(`offer:${id}`);
    await kv.del(`offer:${id}`);
    await addHistory(actor, "Suppression", "Offre", existing?.title || id);
    return c.json({ success: true });
  } catch (error) {
    console.log("Error deleting offer:", error);
    return c.json({ error: `Erreur suppression de l'offre: ${error}` }, 500);
  }
});

app.get("/make-server-be42ff6e/settings", async (c) => {
  try {
    const settings = await kv.get("site:settings");
    return c.json(settings || {});
  } catch (error) {
    console.log("Error fetching settings:", error);
    return c.json({ error: `Erreur rÃ©cupÃ©ration des paramÃ¨tres: ${error}` }, 500);
  }
});

app.put("/make-server-be42ff6e/settings", async (c) => {
  try {
    const body = await c.req.json();
    const actor = body.actor || "Inconnu";
    const settings = body.settings || body;
    delete settings.actor;
    await kv.set("site:settings", settings);
    await addHistory(actor, "Modification", "Réglages du site", "Coordonnées, horaires ou textes");
    return c.json(settings);
  } catch (error) {
    console.log("Error saving settings:", error);
    return c.json({ error: `Erreur sauvegarde des paramÃ¨tres: ${error}` }, 500);
  }
});

Deno.serve(app.fetch);

