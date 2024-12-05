import axios from "axios";

const serUrl = process.env.REACT_APP_SERVER_URL;

export const whoami = async () => {
  try {
    const response = await axios.get(`${serUrl}/users/whoami`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.log(error);
    return null;
  }
};
