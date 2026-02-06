import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import swaggerUiExpress from "swagger-ui-express";
import swaggerAutogen from "swagger-autogen";
import routes from "./routes/index.js";
import errorHandler from "./middleware/errorHandler.js";

dotenv.config();

const app = express();

// BigInt와 Date를 JSON으로 직렬화하기 위한 설정
app.set("json replacer", (key, value) => {
  if (typeof value === "bigint") {
    return Number(value);
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return value;
});

// CORS 설정
const corsOptions = {
  origin: [
    "http://localhost:5173",
    "https://veridoc-client.vercel.app",
    "https://veridoc-umber.vercel.app"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(express.json());
if (process.env.NODE_ENV !== "production") {
  app.set("json spaces", 2);
}
app.use("/api/v1", routes);

// Swagger UI + Autogen
app.use(
  "/docs",
  swaggerUiExpress.serve,
  swaggerUiExpress.setup({}, {
    swaggerOptions: {
      url: "/openapi.json",
    },
  })
);

app.use(
  "/api-docs",
  swaggerUiExpress.serve,
  swaggerUiExpress.setup({}, {
    swaggerOptions: {
      url: "/openapi.json",
    },
  })
);

app.get("/openapi.json", async (req, res, next) => {
  // #swagger.ignore = true
  try {
    const options = {
      openapi: "3.0.0",
      disableLogs: true,
      writeOutputFile: false,
    };
    const outputFile = "/dev/null";
    const apiRoutes = ["./src/routes/index.js"];
    const doc = {
      info: {
        title: "VeriDoc API",
        description: "VeriDoc 서비스의 API 문서입니다.",
      },
      host: "localhost:3000",
      basePath: "/api/v1",
      schemes: ["http"],
    };

    const result = await swaggerAutogen(options)(outputFile, apiRoutes, doc);
    return res.json(result ? result.data : null);
  } catch (err) {
    return next(err);
  }
});

// Health
app.get("/health", (req, res) => res.json({ success: true, message: "ok" }));

// Global error handler (should be last middleware)
app.use(errorHandler);

export default app;
