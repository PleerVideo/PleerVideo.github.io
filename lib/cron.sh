#!/bin/bash
# echo "0 1 * * * root chmod +x /home/pleer.video/lib/cron.sh && bash /home/pleer.video/lib/cron.sh" >> /etc/crontab;
curl -X POST -d '{}' https://api.netlify.com/build_hooks/5f7f44f20f42e517d1935a69
sleep 600
cd /home/pleer.video && \
mkdir -p public && \
rm -rf public/ids.json public/movies*.json public/episodes*.json public/movies*.xml public/episodes*.xml;
wget https://romantic-noyce-264229.netlify.app/ids.json -qO /home/pleer.video/public/ids.json;
wget https://romantic-noyce-264229.netlify.app/movies.json -qO /home/pleer.video/public/movies.json;
wget https://romantic-noyce-264229.netlify.app/episodes.json -qO /home/pleer.video/public/episodes.json;
for url in https://romantic-noyce-264229.netlify.app/movies{1..100}.json; do wget -P /home/pleer.video/public/ $url || break; done;
for url in https://romantic-noyce-264229.netlify.app/episodes{1..100}.json; do wget -P /home/pleer.video/public/ $url || break; done;
wget https://romantic-noyce-264229.netlify.app/movies.xml -qO /home/pleer.video/public/movies.xml;
for url in https://romantic-noyce-264229.netlify.app/movies{1..100}.xml; do wget -P /home/pleer.video/public/ $url || break; done;
for url in https://romantic-noyce-264229.netlify.app/movies-RSS{1..100}.xml; do wget -P /home/pleer.video/public/ $url || break; done;
wget https://romantic-noyce-264229.netlify.app/episodes.xml -qO /home/pleer.video/public/episodes.xml;
for url in https://romantic-noyce-264229.netlify.app/episodes{1..100}.xml; do wget -P /home/pleer.video/public/ $url || break; done;
for url in https://romantic-noyce-264229.netlify.app/episodes-RSS{1..100}.xml; do wget -P /home/pleer.video/public/ $url || break; done;
cd /home/pleer.video && \
find ./public -name "*.json" -size -100c -delete && \
find ./public -name "*.xml" -size -100c -delete && \
cp --recursive public/*.json ./json/ && \
cp --recursive public/*.xml ./xml/ && \
pm2 reload all