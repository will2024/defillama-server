import '../../../api2/utils/failOnError'

import { handler2 } from ".";
import { ADAPTER_TYPES } from "../triggerStoreAdaptorData";
import { getUnixTimeNow } from '../../../api2/utils/time';
import { addRuntimeLog, addErrorLog } from '../../../utils/elasticsearch';

async function run() {
  const startTimeAll = getUnixTimeNow()
  console.time("**** Run All Adaptor types")

  await Promise.all(ADAPTER_TYPES.map(async (adapterType) => {
    const startTimeCategory = getUnixTimeNow()
    const key = "**** Run Adaptor type: " + adapterType
    console.time(key)
    let success = false

    try {

      await handler2({ adapterType })

    } catch (e) {
      console.error("error", e)
      await addErrorLog({
        error: e as any,
        metadata: {
          application: "dimensions",
          isCategory: true,
          category: adapterType,
        }
      })
    }

    console.timeEnd(key)
    const endTimeCategory = getUnixTimeNow()
    await addRuntimeLog({
      runtime: endTimeCategory - startTimeCategory,
      success,
      metadata: {
        application: "dimensions",
        isCategory: true,
        category: adapterType,
      }
    })

  }))

  console.timeEnd("**** Run All Adaptor types")
  const endTimeAll = getUnixTimeNow()
  await addRuntimeLog({
    runtime: endTimeAll - startTimeAll,
    success: true,
    metadata: {
      application: "dimensions",
      isApplication: true,
    }
  })
}

run().catch(console.error).then(() => process.exit(0))

// catch unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Dimensions runner: Unhandled Rejection at:', reason, 'promise:', promise);
  process.exit(1)
});

process.on('uncaughtException', (error) => {
  console.error('Dimensions runner: Uncaught Exception thrown', error);
  process.exit(1)
})

setTimeout(() => {
  console.error("Timeout reached, exiting from dimensions-store-all...")
  process.exit(1)
}, 1000 * 60 * 45) // 45 minutes