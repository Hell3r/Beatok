import hashlib
import json
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any, Tuple
import aiofiles
from pathlib import Path
from fastapi import Depends

class AudioFingerprintService:
    
    def __init__(self, db: AsyncSession):
        # НЕ ТРОГАТЬ НАХУЙ НИКОГДА, ЭТИ ТАЙМИНГИ СДОХНУТ ВМЕСТЕ С НАМИ
        self.timings = [12.0, 23.0, 28.0, 35.0]
    
    async def extract_fingerprint(self, file_path: Path) -> Tuple[str, Dict[str, Any]]:
        fingerprint_data = {
            "method": "64bit_4x16",
            "timings": [],
            "fingerprint": ""
        }
        
        try:
            async with aiofiles.open(file_path, 'rb') as f:
                content = await f.read()
            
            audio_data_start = 44
            if len(content) < audio_data_start:
                raise ValueError("Файл слишком мал для извлечения фингерпринта")
            
            fingerprint = 0
            
            for i, timing in enumerate(self.timings):
                sample_position = int(timing * 44100)
                byte_position = audio_data_start + (sample_position * 4)
                
                if byte_position + 1 >= len(content):
                    byte_position = audio_data_start
                
                segment_value = 0
                if byte_position + 1 < len(content):
                    segment = content[byte_position:byte_position + 2]
                    if len(segment) == 2:
                        segment_value = int.from_bytes(segment, 'little', signed=True)
                        segment_value = abs(segment_value) & 0xFFFF
                
                fingerprint_data["timings"].append({
                    "index": i,
                    "time_sec": timing,
                    "byte_position": byte_position,
                    "value": segment_value,
                    "value_hex": f"{segment_value:04x}"
                })
                
                fingerprint = (fingerprint << 16) | segment_value
            
            fingerprint_hex = f"{fingerprint:016x}"
            fingerprint_data["fingerprint"] = fingerprint_hex
            
            return fingerprint_hex, fingerprint_data
            
        except Exception as e:
            print(f"Ошибка при извлечении фингерпринта: {e}")
            fingerprint_data["timings"] = [{"error": str(e)}]
            fingerprint_data["fingerprint"] = "0" * 16
            return "0" * 16, fingerprint_data
    
    def compare_fingerprints(self, fp1_hex: str, fp2_hex: str) -> Tuple[bool, float]:
        try:
            fp1 = int(fp1_hex, 16)
            fp2 = int(fp2_hex, 16)
            
            xor_result = fp1 ^ fp2
            different_bits = bin(xor_result).count('1')
            similarity = 1.0 - (different_bits / 64.0)
            
            return similarity >= 0.85, round(similarity, 4)
            
        except:
            return False, 0.0