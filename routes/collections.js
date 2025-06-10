const express = require("express");
const mongoose = require("mongoose");
const validator = require("validator");
const Collection = require("../models/Collection");
const Link = require("../models/Link");

const router = express.Router();

// Get all collections for the current user
// This endpoint returns all collections the user owns or is shared with
router.get("/collections", async (req, res) => {
  const collections = await Collection.find({
    $or: [{ owner: req.user._id }, { sharedWith: req.user._id }],
  }).populate("linkIds");
  const result = collections.map((col) => {
    // Sort links by counter descending
    const sortedLinks = [...col.linkIds].sort(
      (a, b) => (b.counter || 0) - (a.counter || 0)
    );
    return {
      _id: col._id,
      name: col.name,
      links: sortedLinks,
      isOwner: col.owner.equals(req.user._id),
      shareId: col.shareId,
    };
  });
  res.json(result);
});

// Add a new collection
router.post("/collections", async (req, res) => {
  if (!req.body || !req.body.name) {
    return res.status(400).json({ error: "Name is required" });
  }
  const { name } = req.body;
  const existing = await Collection.findOne({ name, owner: req.user._id });
  if (existing) {
    return res
      .status(409)
      .json({ error: "Collection with this name already exists" });
  }
  const collection = new Collection({ name, owner: req.user._id });
  await collection.save();
  res.status(201).json(collection);
});

// Delete a collection
router.delete("/collections/:id", async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: "Invalid collection id" });
  }
  const collection = await Collection.findOne({
    _id: req.params.id,
    owner: req.user._id,
  });
  if (!collection) {
    return res.status(404).json({ error: "Collection not found or not owner" });
  }
  const linkIds = collection.linkIds.map((id) => id.toString());
  await collection.deleteOne();
  for (const linkId of linkIds) {
    const usedElsewhere = await Collection.exists({ linkIds: linkId });
    if (!usedElsewhere) {
      await Link.findByIdAndDelete(linkId);
    }
  }
  res.sendStatus(204);
});

// Edit a collection's name
router.put("/collections/:id/name", async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: "Invalid collection id" });
  }
  if (!req.body || !req.body.name)
    return res.status(400).json({ error: "Name is required" });
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required" });
  const collection = await Collection.findOneAndUpdate(
    { _id: req.params.id, owner: req.user._id },
    { name },
    { new: true }
  );
  if (!collection) {
    return res.status(404).json({ error: "Collection not found or not owner" });
  }
  res.json({ _id: collection._id, name: collection.name });
});

// Join a shared collection
router.post("/collections/join/:shareId", async (req, res) => {
  const collection = await Collection.findOneAndUpdate(
    {
      shareId: req.params.shareId,
      sharedWith: { $ne: req.user._id },
      owner: { $ne: req.user._id },
    },
    { $push: { sharedWith: req.user._id } },
    { new: true }
  );
  if (!collection) {
    return res
      .status(404)
      .json({ error: "Collection not found or already a member" });
  }
  res.json({
    _id: collection._id,
    name: collection.name,
    links: collection.linkIds,
    isOwner: false,
    shareId: collection.shareId,
  });
});

// Leave a shared collection
router.post("/collections/:id/leave", async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: "Invalid collection id" });
  }
  const collection = await Collection.findOneAndUpdate(
    { _id: req.params.id, sharedWith: req.user._id },
    { $pull: { sharedWith: req.user._id } },
    { new: true }
  );
  if (!collection) {
    return res
      .status(404)
      .json({ error: "Collection not found or not shared with you" });
  }
  res.sendStatus(204);
});

// Add an existing link to another collection
router.post("/collections/:collectionId/links/:linkId", async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.collectionId)) {
    return res.status(400).json({ error: "Invalid collection id" });
  }
  if (!mongoose.Types.ObjectId.isValid(req.params.linkId)) {
    return res.status(400).json({ error: "Invalid link id" });
  }
  // Check if the link exists
  const link = await Link.findById(req.params.linkId);
  if (!link) {
    return res.status(404).json({ error: "Link not found" });
  }
  const collection = await Collection.findOneAndUpdate(
    {
      _id: req.params.collectionId,
      $or: [{ owner: req.user._id }, { sharedWith: req.user._id }],
      linkIds: { $ne: req.params.linkId },
    },
    { $push: { linkIds: req.params.linkId } },
    { new: true }
  ).populate("linkIds");
  if (!collection) {
    return res
      .status(404)
      .json({ error: "Collection not found or link already added" });
  }
  res.json({
    _id: collection._id,
    name: collection.name,
    links: collection.linkIds,
    isOwner: collection.owner.equals(req.user._id),
    shareId: collection.shareId,
  });
});

const getFaviconUrl = (url) => {
  try {
    const { hostname } = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=256`;
  } catch {
    return "";
  }
};

// Add a new link to a collection
router.post("/collections/:collectionId/links", async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.collectionId)) {
    return res.status(400).json({ error: "Invalid collection id" });
  }
  if (!req.body || !req.body.url || !req.body.name) {
    return res.status(400).json({ error: "URL and name are required" });
  }
  const { url, name } = req.body;
  const collection = await Collection.findOne({
    _id: req.params.collectionId,
    $or: [{ owner: req.user._id }, { sharedWith: req.user._id }],
  });
  if (!collection) {
    return res.status(404).json({ error: "Collection not found" });
  }
  // Validate URL
  if (!validator.isURL(url, { require_protocol: true })) {
    return res.status(400).json({ error: "Invalid URL" });
  }
  // Check if link already exists in this collection
  const existingLink = await Link.findOne({ url, name });
  if (existingLink && collection.linkIds.includes(existingLink._id)) {
    return res
      .status(409)
      .json({ error: "Link already exists in this collection" });
  }
  // Create new link or reuse existing
  let link;
  if (existingLink) {
    link = existingLink;
  } else {
    const iconUrl = getFaviconUrl(url);
    link = new Link({ url, name, icon: iconUrl });
    await link.save();
  }
  collection.linkIds.push(link._id);
  await collection.save();
  await collection.populate("linkIds");
  res.status(201).json({
    _id: collection._id,
    name: collection.name,
    links: collection.linkIds,
    isOwner: collection.owner.equals(req.user._id),
    shareId: collection.shareId,
  });
});

// Remove a link from a collection
router.delete("/collections/:collectionId/links/:linkId", async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.collectionId)) {
    return res.status(400).json({ error: "Invalid collection id" });
  }
  if (!mongoose.Types.ObjectId.isValid(req.params.linkId)) {
    return res.status(400).json({ error: "Invalid link id" });
  }
  // Check if the link exists in the collection before removing
  const collection = await Collection.findOne({
    _id: req.params.collectionId,
    $or: [{ owner: req.user._id }, { sharedWith: req.user._id }],
    linkIds: req.params.linkId,
  });
  if (!collection) {
    return res.status(404).json({ error: "Link not found in this collection" });
  }
  await Collection.updateOne(
    { _id: req.params.collectionId },
    { $pull: { linkIds: req.params.linkId } }
  );
  if (!collection) {
    return res.status(404).json({ error: "Collection not found" });
  }
  const usedElsewhere = await Collection.exists({ linkIds: req.params.linkId });
  if (!usedElsewhere) {
    await Link.findByIdAndDelete(req.params.linkId);
  }
  res.sendStatus(204);
});

// Edit a link's name or URL
router.put("/links/:linkId", async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.linkId)) {
    return res.status(400).json({ error: "Invalid link id" });
  }
  if (!req.body || (!req.body.name && !req.body.url)) {
    return res
      .status(400)
      .json({ error: "At least one of name or url is required" });
  }
  const existingLink = await Link.findById(req.params.linkId);
  if (!existingLink) {
    return res.status(404).json({ error: "Link not found" });
  }

  // Check if user is owner or member of at least one collection containing this link
  const hasAccess = await Collection.exists({
    linkIds: req.params.linkId,
    $or: [{ owner: req.user._id }, { sharedWith: req.user._id }],
  });
  if (!hasAccess) {
    return res.sendStatus(403);
  }

  const update = {};
  if (req.body.name) update.name = req.body.name;
  if (req.body.url) {
    update.url = req.body.url;
    update.icon = getFaviconUrl(req.body.url);
  }
  const link = await Link.findByIdAndUpdate(req.params.linkId, update, {
    new: true,
  });
  res.json(link);
});

// Increase click counter and update last accessed time
router.post("/links/:linkId/click", async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.linkId)) {
    return res.status(400).json({ error: "Invalid link id" });
  }
  const link = await Link.findById(req.params.linkId);
  if (!link) {
    return res.status(404).json({ error: "Link not found" });
  }
  // Check if user is owner or member of at least one collection containing this link
  const hasAccess = await Collection.exists({
    linkIds: req.params.linkId,
    $or: [{ owner: req.user._id }, { sharedWith: req.user._id }],
  });
  if (!hasAccess) {
    return res.sendStatus(403);
  }
  link.lastAccessedAt = new Date();
  link.counter = (link.counter || 0) + 1;
  await link.save();
  res.json(link);
});

module.exports = router;
