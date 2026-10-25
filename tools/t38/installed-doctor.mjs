import {verifyE4} from '../../server/studio/aghr/e4-bridge.js';
import {createPilotCatalog} from '../../server/studio/projects/pilots.mjs';
import {createReviewSource} from '../../server/studio/review-source.js';
import {createCatalog} from '../../server/studio/db/catalog.js';
import {resourceProfiles} from '../../server/studio/aghr/job-runner.js';
import {createUnifiedStudio} from '../../server/studio/unified-runtime.mjs';
if(typeof createUnifiedStudio!=='function')throw Error('STUDIO_IMPORT_CLOSURE_INVALID');
verifyE4();const pilots=createPilotCatalog().list(),review=createReviewSource(),catalog=createCatalog();
try{console.log(JSON.stringify({status:'PASS_BUNDLED_BYTES_AND_READ_MODELS',node:process.version,engines:'E2_E3_E4_UNCHANGED',tables:catalog.tables.length,pilots:pilots.map(p=>p.project.id),review_units:review.items.length,resourceProfiles,signature:'UNSIGNED_WARNING',live_qualification:'NOT_RUN',state_written:false,release_acceptance:'NOT_GRANTED'}));}finally{catalog.close();}
