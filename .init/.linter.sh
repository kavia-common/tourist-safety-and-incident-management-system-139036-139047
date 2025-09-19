#!/bin/bash
cd /home/kavia/workspace/code-generation/tourist-safety-and-incident-management-system-139036-139047/frontend_web_mobile
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

