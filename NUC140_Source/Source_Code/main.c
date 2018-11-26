#include "NUC_config.h"

void vibration()
{
	// Rung
	DrvGPIO_Open(E_GPC,0,E_IO_OUTPUT);
	DrvGPIO_SetBit(E_GPC,0);
	DrvSYS_Delay(500000);
}


int main()
{
	
	uint8_t state_up = 1, state_down = 1, state_left = 1, state_right = 1, state_ok = 1, state_cancel = 1;
	ESP_config();
	ESP_set_vibration_handler(vibration);
	NUC_button_config();
	//set_debounce_button();
	NUC_LED_config();
	while(1)
	{
		//Button press handler
		if((!DrvGPIO_GetBit(E_GPC,1))&& (state_down == 1))
		{
			ESP_send_key(KEY_DOWN);
		}
		if((!DrvGPIO_GetBit(E_GPC,2))&& (state_right == 1))
		{
			ESP_send_key(KEY_RIGHT);
		}
		if((!DrvGPIO_GetBit(E_GPC,3))&& (state_left == 1))
		{
			ESP_send_key(KEY_LEFT);
		}
		if((!DrvGPIO_GetBit(E_GPD,7))&& (state_up == 1))
		{
			ESP_send_key(KEY_UP);
		}
		if((!DrvGPIO_GetBit(E_GPA,12))&& (state_ok == 1))
		{
			ESP_send_key(KEY_OK);
		}
		if(!DrvGPIO_GetBit(E_GPA,13)&& (state_cancel == 1))
		{
			ESP_send_key(KEY_CANCEL);
		}
	
		state_down = DrvGPIO_GetBit(E_GPC,1);
		state_right = DrvGPIO_GetBit(E_GPC,2);
		state_left = DrvGPIO_GetBit(E_GPC,3);
		state_up = DrvGPIO_GetBit(E_GPD,7);
		state_ok = DrvGPIO_GetBit(E_GPA,12);
		state_cancel = DrvGPIO_GetBit(E_GPA,13);
		DrvSYS_Delay(1000);
	}
	
	return 0;
}
