#include "NUC_config.h"

volatile uint8_t Receive_buf[16] = "";
volatile uint16_t readCount = 0;
vibration_handler_t vibra = NULL;
volatile uint8_t Timers_Vibration = 0;
volatile uint8_t Timer_Cnt = 1;
uint32_t Timer_High = 0;
uint32_t Timer_Low = 0;
uint32_t Ticks = 1;
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
//		if(readCount < 1) // check if Buffer is full
//		{
			Receive_buf[readCount] = bInChar[0];
//			readCount++;
//		}
//		else if (readCount==1)
//		{
			//readCount=0;
		
//		}			
	}
	
	if(Receive_buf[0] == 'h')
	{
		ESP_send_key('H');
		(*vibra)(73728,18432);		// 0.6s rung, 0.4s tat
	}
	else if(Receive_buf[0] == 'e')	
	{
		ESP_send_key('E');
		(*vibra)(46080,46080);	// 1.2s rung, 0.8s tat
	}
}

void Led_Test(int32_t time)
{
	DrvGPIO_ClrBit(E_GPA,15);
	DrvSYS_Delay(time);
	DrvGPIO_SetBit(E_GPA,15);
	DrvSYS_Delay(time);
}

void TMR0_IRQHandler(void) // Timer0 interrupt subroutine 
{
	/*
		if ((Timer_Cnt %2) == 0) 
		{
			DrvGPIO_SetBit(E_GPA,15);
			DrvGPIO_SetBit(E_GPA,14);
			//TIMER0->TCSR.MODE = E_ONESHOT_MODE; 
			//TIMER0->TCSR.CEN = 1;
			TIMER0->TISR.TIF = 1;
		}
		else
		{
			DrvGPIO_SetBit(E_GPA,15);

			DrvGPIO_ClrBit(E_GPA,14);
			//TIMER0->TCSR.MODE = E_ONESHOT_MODE; 
			//TIMER0->TCSR.CEN = 1;
			TIMER0->TISR.TIF = 1;
		}
		Timer_Cnt++;
	*/
	
	
	if(Timer_Cnt <= 6)
	{
		if ((Timer_Cnt %2) == 0) 
		{
			DrvGPIO_SetBit(E_GPA,14);
			TIMER0->TCMPR = Timer_High;	
			TIMER0->TISR.TIF = 1;			
			TIMER0->TCSR.MODE = E_ONESHOT_MODE;
			TIMER0->TCSR.CEN = 1;
			//set_TimerPWM_Vibra(Timer_High);
			Timer_Cnt++;
		}
		else
		{
			DrvGPIO_ClrBit(E_GPA,14);
			TIMER0->TCMPR = Timer_Low;
			TIMER0->TISR.TIF = 1;
			TIMER0->TCSR.MODE = E_ONESHOT_MODE; 
			TIMER0->TCSR.CEN = 1;			
			//DrvTIMER_Open (E_TMR0, Timer_Low, E_ONESHOT_MODE);
			//set_TimerPWM_Vibra(Timer_Low);
			Timer_Cnt++;
		}
			//Timers_Vibration++;
	}
	// after 4 times turn off timer 
	else
		{
			NVIC_DisableIRQ(TMR0_IRQn);	//Enable Timer0 Interrupt
			Timer_Cnt = 0 ;
		}
	
}



void set_TimerPWM_Vibra()
	{
   
	SYSCLK->CLKSEL1.TMR0_S = 0x07;				//Select 12Mhz for Timer0 clock source 
	SYSCLK->APBCLK.TMR0_EN = 1;					//Enable Timer0 clock source
		
	TIMER0->TCSR.MODE = E_ONESHOT_MODE; 			//Select operation mode
	TIMER0->TCSR.PRESCALE = 239;					// Set Prescale [0~255]
	TIMER0->TCMPR = 9216;		    				//Timeout period = (1 / 12MHz) * ( 127 + 1 ) * 46080 = 0.5 sec
	
	TIMER0->TCSR.IE = 1;
	TIMER0->TISR.TIF = 1;						//Write 1 to clear for safty		
	NVIC_DisableIRQ(TMR0_IRQn);					//Enable Timer0 Interrupt
	TIMER0->TCSR.CRST = 1;						//Reset up counter
	TIMER0->TCSR.CEN = 1;						//Enable Timer0
//	(*vibra)(73728,18432);
//	DrvGPIO_ClrBit(E_GPA,15);
	}

void enable_Timer0()
{
		NVIC_EnableIRQ(TMR0_IRQn);	//Enable Timer0 Interrupt
		TIMER0->TCSR.CEN = 1;		//Enable Timer0
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
	DrvGPIO_Open(E_GPC, 0, E_IO_OUTPUT);  // PWM pin for Vibration
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



















