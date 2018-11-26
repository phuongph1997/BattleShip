#ifndef __NUC_CONFIG_H__
#define __NUC_CONFIG_H__

#include <stdio.h>
#include "NUC1xx.h"
#include "Driver\DrvUART.h"

#include "Driver\DrvGPIO.h"
#include "Driver\DrvSYS.h"

#define BAUD9600	9600
//#define BAUD115	11500


typedef void (*vibration_handler_t) (void); 

#define KEY_UP			0x01
#define KEY_DOWN		0x02
#define KEY_LEFT		0x04
#define KEY_RIGHT		0x08
#define KEY_CANCEL	0x10
#define KEY_OK			0x20
#define VIBRATION		0x40

void ESP_config();
void NUC_LED_config();
void NUC_LED_on(int32_t);
void NUC_LED_off(int32_t);
//void VIBRATION_config();
void ESP_send_key(uint8_t Keys);
void ESP_set_vibration_handler(vibration_handler_t handler);
void NUC_button_config();
void set_debounce_button();
/*
void NUC_press_up();
void NUC_press_down();
void NUC_press_right();
void NUC_press_left();
void NUC_press_OK();
void NUC_press_cancel();
*/

#endif /* __NUC_CONFIG_H__ */


