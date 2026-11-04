import { describe, expect, it } from 'vitest';
import { readGameRequest } from '../supabase/functions/_shared/request';
const req=(body:string,type='application/json')=>new Request('https://game.test',{method:'POST',headers:{'Content-Type':type},body});
describe('bounded API request parsing',()=>{
  it('accepts a bounded JSON object',async()=>{expect(await readGameRequest(req('{"op":"state"}'))).toEqual({op:'state'});});
  it('rejects null, arrays, malformed JSON and wrong content types',async()=>{for(const body of ['null','[]','{'])await expect(readGameRequest(req(body))).rejects.toThrow();await expect(readGameRequest(req('{}','text/plain'))).rejects.toThrow('JSON required');});
  it('caps streaming bodies by bytes without trusting Content-Length',async()=>{await expect(readGameRequest(req(JSON.stringify({op:'state',text:'x'.repeat(5000)})))).rejects.toThrow('too large');await expect(readGameRequest(req(JSON.stringify({text:'界'.repeat(2000)})))).rejects.toThrow('too large');});
});
