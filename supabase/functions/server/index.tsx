import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";

const app = new Hono();

app.use('*', logger(console.log));
app.use("/*", cors({
  origin: "*",
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  exposeHeaders: ["Content-Length"],
  maxAge: 600,
}));

app.get("/make-server-be42ff6e/health", (c) => c.json({ status: "ok" }));

app.get("/make-server-be42ff6e/offers", async (c) => {
  try {
    const offers = await kv.getByPrefix("offer:");
    offers.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return c.json(offers);
  } catch (error) {
    console.log("Error fetching offers:", error);
    return c.json({ error: `Erreur rÃ©cupÃ©ration des offres: ${error}` }, 500);
  }
});

app.post("/make-server-be42ff6e/offers", async (c) => {
  try {
    const body = await c.req.json();
    const offer = {
      id: crypto.randomUUID(),
      title: body.title,
      description: body.description,
      badge: body.badge || "",
      imageUrl: body.imageUrl || "",
      validUntil: body.validUntil || "",
      createdAt: new Date().toISOString(),
    };
    await kv.set(`offer:${offer.id}`, offer);
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
    const updated = { ...existing, ...body, id };
    await kv.set(`offer:${id}`, updated);
    return c.json(updated);
  } catch (error) {
    console.log("Error updating offer:", error);
    return c.json({ error: `Erreur mise Ã  jour de l'offre: ${error}` }, 500);
  }
});

app.delete("/make-server-be42ff6e/offers/:id", async (c) => {
  try {
    const id = c.req.param("id");
    await kv.del(`offer:${id}`);
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
    await kv.set("site:settings", body);
    return c.json(body);
  } catch (error) {
    console.log("Error saving settings:", error);
    return c.json({ error: `Erreur sauvegarde des paramÃ¨tres: ${error}` }, 500);
  }
});

Deno.serve(app.fetch);

