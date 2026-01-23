# Backend service setup

1. **Unit file location**: `/etc/systemd/system/backend.service`
2. **Environment**:
   - `WorkingDirectory=/home/deploy/vite_react_shadcn_ts/server`
   - `Environment=NODE_ENV=production`
   - `ExecStart=/usr/bin/node /home/deploy/vite_react_shadcn_ts/server/server.js`
   - `Restart=on-failure`
   - `SELinuxContext=system_u:system_r:unconfined_service_t:s0`
   - `StandardOutput=journal`
   - `StandardError=inherit`
3. **Reload/start**:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl restart backend.service
   ```
4. **Verification**:
   ```bash
   sudo journalctl -u backend.service --since "5 minutes ago"
   ```
