#!/bin/bash
USER_AGENT="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

extract() {
  id=$1
  url=$2
  echo "Extracting for $id from $url ..."
  ffmpeg -y -user_agent "$USER_AGENT" -ss 00:00:01 -i "$url" -vframes 1 -q:v 2 "/tmp/${id}.jpg"
  ls -lh "/tmp/${id}.jpg"
}

extract "6ad4d822db2275f17c9eb714" "https://video.twimg.com/amplify_video/2110032381172146177/pl/vTF1O012I_bL9PFs.m3u8?tag=29&v=cfc&variant_version=1"
extract "6ad4d926db2275f17c9eb749" "https://video.twimg.com/amplify_video/2111686745678925824/pl/C_ahpPXiqUv-HYqP.m3u8?tag=29&v=916&variant_version=1"
extract "6ad4db270228c4ea96c1e550" "https://video.twimg.com/amplify_video/2111622495103012864/pl/Rj8aOzTA4Xu230bN.m3u8?tag=29&variant_version=1"
extract "6ad52c6ef66573eea25b7a12" "https://video.twimg.com/amplify_video/2111857560374611968/pl/i0l0YsfpHPRCzNmw.m3u8?tag=29&variant_version=1"
extract "6ad52d1670f95f2fc4113567" "https://video.twimg.com/amplify_video/2109633773302104065/pl/eEOTc8E1_X2MUN1f.m3u8?tag=29&variant_version=1"
