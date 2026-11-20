const ApiError = require('./ApiError');
const { escapeRegex } = require('./sanitize');
const { logActivity } = require('./activity');

/**
 * Generic list/get/create/update/delete handlers used by admin modules.
 * Supports ?page, ?limit, ?q (regex search on searchFields), ?sort and
 * exact-match filters for any key listed in `filters`.
 */
function crud(Model, opts = {}) {
  const {
    entity = Model.modelName,
    searchFields = ['name'],
    filters = [],
    populate = '',
    defaultSort = '-createdAt',
    writable, // optional whitelist of fields for create/update
  } = opts;

  const pick = (body) => {
    if (!writable) return body;
    return Object.fromEntries(Object.entries(body).filter(([k]) => writable.includes(k)));
  };

  return {
    async list(req, res) {
      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 20));
      const query = {};
      if (req.query.q) {
        const rx = new RegExp(escapeRegex(req.query.q), 'i');
        query.$or = searchFields.map((f) => ({ [f]: rx }));
      }
      for (const key of filters) {
        const v = req.query[key];
        if (v === undefined || v === '') continue;
        query[key] = v === 'true' ? true : v === 'false' ? false : String(v);
      }
      const sort = typeof req.query.sort === 'string' ? req.query.sort : defaultSort;
      const [items, total] = await Promise.all([
        Model.find(query).sort(sort).skip((page - 1) * limit).limit(limit).populate(populate).lean(),
        Model.countDocuments(query),
      ]);
      res.json({ items, total, page, pages: Math.ceil(total / limit) || 1 });
    },

    async get(req, res) {
      const doc = await Model.findById(req.params.id).populate(populate).lean();
      if (!doc) throw ApiError.notFound(`${entity} not found`);
      res.json(doc);
    },

    async create(req, res) {
      const doc = await Model.create(pick(req.body));
      logActivity(req, 'created', entity, doc._id, { name: doc.name || doc.title || doc.code });
      res.status(201).json(doc);
    },

    async update(req, res) {
      const doc = await Model.findById(req.params.id);
      if (!doc) throw ApiError.notFound(`${entity} not found`);
      doc.set(pick(req.body));
      await doc.save();
      logActivity(req, 'updated', entity, doc._id, { name: doc.name || doc.title || doc.code, fields: Object.keys(req.body) });
      res.json(doc);
    },

    async remove(req, res) {
      const doc = await Model.findByIdAndDelete(req.params.id);
      if (!doc) throw ApiError.notFound(`${entity} not found`);
      logActivity(req, 'deleted', entity, doc._id, { name: doc.name || doc.title || doc.code });
      res.json({ ok: true });
    },
  };
}

/** Wire CRUD handlers onto an express Router. */
function mountCrud(router, handlers) {
  router.get('/', handlers.list);
  router.post('/', handlers.create);
  router.get('/:id', handlers.get);
  router.put('/:id', handlers.update);
  router.patch('/:id', handlers.update);
  router.delete('/:id', handlers.remove);
  return router;
}

module.exports = { crud, mountCrud };
