import pool from '../../database'; // renamed from 'connect'

const getChatHistory = async (number?: string) => {
  // don't call pool(), just use it directly
  try {
    let rows;

    if (number) {
      const [result] = await pool.query(
        'SELECT * FROM whatsapp_chats WHERE `from` = ? OR `to` = ? ORDER BY id ASC',
        [number, number]
      );

      rows = result;
    } else {
      const [result] = await pool.query('SELECT * FROM whatsapp_chats ORDER BY id ASC');
      rows = result;
    }

    return rows;
  } catch (error) {
    console.error('❌ Error fetching chat history:', error);
    throw new Error('Failed to fetch chat history');
  }
};

export default getChatHistory;
