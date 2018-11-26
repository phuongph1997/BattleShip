#include "NUC_config.h"

volatile uint8_t Receive_buf[16] = "";
volatile uint16_t readCount = 0;
volatile vibration_handler_t vibra = NULL;

/*---------------------------------------------------------------------------------------------------------*/
/* UART Callback function                                                                           	   */
/*---------------------------------------------------------------------------------------------------------*/
void UART_INT_HANDLE(uint32_t userData)
{
	//uint8_t i;
	uint8_t bInChar[1] = {0xFF};

	while(UART0->ISR.RDA_IF==1) 
	{
		DrvUART_Read(UART_PORT0,bInChar,1);	
		if(readCount < 8) // check if Buffer is full
		{
			Receive_buf[readCount] = bInChar[0];
			readCount++;
		}
		else if (readCount==8)
		{
			readCount=0;
		}			
	}
	
	if(Receive_buf[0] == VIBRATION)
	{
		vibra();
	}
	
}

void ESP_config()
{	
	STR_UART_T sParam;
	DrvGPIO_InitFunction(E_FUNC_UART0);
/* UART Setting */
#ifdef  BAUD9600
    sParam.u32BaudRate 		= 9600;
#endif
	
#ifdef  BAUD115
    sParam.u32BaudRate 		= 115200;
#endif
	
    sParam.u8cDataBits 		= DRVUART_DATABITS_8;
    sParam.u8cStopBits 		= DRVUART_STOPBITS_1;
    sParam.u8cParity 		= DRVUART_PARITY_NONE;
    sParam.u8cRxTriggerLevel= DRVUART_FIFO_1BYTES;

	/* Set UART Configuration */
 	if(DrvUART_Open(UART_PORT0,&sParam) != E_SUCCESS);  

	DrvUART_EnableInt(UART_PORT0, DRVUART_RDAINT,UART_INT_HANDLE);  	
}

void ESP_send_key(uint8_t Keys)
{
	DrvUART_Write(UART_PORT0,&Keys,1);
}
void ESP_set_vibration_handler(vibration_handler_t handler)
{
	vibra = handler;
}

void NUC_button_config()
{
	DrvGPIO_Open(E_GPC,0,E_IO_INPUT);
	DrvGPIO_Open(E_GPC,1,E_IO_INPUT);
	DrvGPIO_Open(E_GPC,2,E_IO_INPUT);
	DrvGPIO_Open(E_GPC,3,E_IO_INPUT);
	DrvGPIO_Open(E_GPD,7,E_IO_INPUT);
	DrvGPIO_Open(E_GPA,12,E_IO_INPUT);
	DrvGPIO_Open(E_GPA,13,E_IO_INPUT);
}

void set_debounce_button()
{
	DrvGPIO_EnableDebounce(E_GPC,0);
	DrvGPIO_EnableDebounce(E_GPC,1);
	DrvGPIO_EnableDebounce(E_GPC,2);
	DrvGPIO_EnableDebounce(E_GPC,3);
	DrvGPIO_EnableDebounce(E_GPD,7);
	DrvGPIO_EnableDebounce(E_GPC,12);
	DrvGPIO_EnableDebounce(E_GPC,13);
	
}

void NUC_LED_config()
{
	DrvGPIO_Open(E_GPA,14,E_IO_OUTPUT);
	DrvGPIO_Open(E_GPA,15,E_IO_OUTPUT);
}

void NUC_LED_on(int32_t Pin)
{
	DrvGPIO_SetBit(E_GPA,Pin);
}
void NUC_LED_off(int32_t Pin)
{
	DrvGPIO_ClrBit(E_GPA,Pin);
}



















