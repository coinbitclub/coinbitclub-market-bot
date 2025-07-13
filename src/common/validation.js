--- (novo arquivo) src/common/validation.js
+import Joi from '@hapi/joi';

+/**
+ * Gera um middleware que valida req.body contra um schema Joi
+ * @param {Joi.ObjectSchema} schema
+ */
+export function validateBody(schema) {
+  return (req, res, next) => {
+    const { error, value } = schema.validate(req.body, { abortEarly: false });
+    if (error) {
+      const messages = error.details.map(d => d.message);
+      return res.status(400).json({ errors: messages });
+    }
+    req.body = value;
+    next();
+  };
+}

+// Exemplo de schema de usuário (ajuste conforme seu domínio)
+export const userSchema = Joi.object({
+  email: Joi.string().email().required(),
+  password: Joi.string().min(6).required(),
+});
