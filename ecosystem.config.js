module.exports = {
  apps: [{
    name: "sita-bot-frontend",
    script: "npm",
    args: "start",
    cwd: "/home/ec2-user/sita-bot-frontend",
    instances: 1,
    exec_mode: "fork",
    env: {
      NODE_ENV: "production",
      PORT: 3000
    },
    error_file: "./logs/error.log",
    out_file: "./logs/out.log",
    log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: "1G"
  }]
}
