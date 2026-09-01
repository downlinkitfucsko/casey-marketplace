const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };
  try {
    const { token, price, imageBase64 } = JSON.parse(event.body);
    if (token !== process.env.STAFF_TOKEN) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }
    if (!price || !imageBase64) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing price or image' }) };
    }

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    const { data: existing, error: fetchError } = await supabase
      .from('items').select('number').eq('status', 'active');
    if (fetchError) throw fetchError;

    const used = new Set(existing.map((r) => r.number));
    let number = null;
    for (let i = 1; i <= 999; i++) { if (!used.has(i)) { number = i; break; } }
    if (number === null) return { statusCode: 400, body: JSON.stringify({ error: 'All 999 slots full' }) };

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const fileName = `item-${String(number).padStart(3, '0')}-${Date.now()}.jpg`;

    const { error: uploadError } = await supabase.storage.from('item-photos').upload(fileName, buffer, { contentType: 'image/jpeg' });
    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage.from('item-photos').getPublicUrl(fileName);

    const { data: inserted, error: insertError } = await supabase
      .from('items').insert({ number, price, image_url: urlData.publicUrl, status: 'active' }).select().single();
    if (insertError) throw insertError;

    return { statusCode: 200, body: JSON.stringify(inserted) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
