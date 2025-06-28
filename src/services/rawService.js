import{executeQuery}from'./databaseService.js';export async function saveRaw(route,p){const t=`INSERT INTO raw_webhook(route,payload)VALUES($1,$2)`;await executeQuery(t,[route,p]);}




