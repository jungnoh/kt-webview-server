#!/bin/bash
if test -f "fcm.json"; then
  export FCM_CREDENTIALS=$(cat fcm.json)
fi
npm run serve