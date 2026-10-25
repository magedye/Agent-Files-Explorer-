import {createBridge} from './aghr/cli-bridge.js';
import {createCatalog} from './db/catalog.js';
import {createSession} from './auth.js';
import {createReadRoutes} from './routes.js';
import {createReviewSource} from './review-source.js';

export async function createStudio({python,actor}={}) {
  const bridge=createBridge({python}),catalog=createCatalog(),session=createSession({actor});
  try {
    const scan=await catalog.scan(bridge);
    if(scan.report.result!=='VALID')throw Error('INITIAL_STRICT_SCAN_FAILED');
    const review=createReviewSource();
    return {bridge,catalog,session,scan,review,handle:createReadRoutes({catalog,bridge,session,review}),close:()=>catalog.close()};
  }catch(error){catalog.close();throw error;}
}
