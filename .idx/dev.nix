@@ .. @@
      web = {
        command = [
-          "npm"
-          "run"
-          "dev"
-          "--"
-          "--port"
-          "$PORT"
-          "--host"
-          "0.0.0.0"
+          "sh"
+          "-c"
+          "cd /workspace && npm run dev -- --port $PORT --host 0.0.0.0"
        ];
        manager = "web";
      };