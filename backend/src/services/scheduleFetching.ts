import axios from "axios";
import {SCHEDULED_WMS_ORDERINFO_URL} from './apiUrl'


const fetchScheduleWmsOrderInfo = async () => {
  try {
    const response = await axios.get(SCHEDULED_WMS_ORDERINFO_URL);
    console.log("Fetching data at", new Date().toISOString());
    console.log("API Response:", response.data);
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error fetching scheduleOrderInfo:", error);
    } else {
      console.error("Unexpected error:", error);
    }
  }
};
// Export the function to make it accessible from other files
export { fetchScheduleWmsOrderInfo };


