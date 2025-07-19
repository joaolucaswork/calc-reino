import { expect, test } from '@playwright/test';

test.describe('Ativos Drag and Drop Debug', () => {
  test.beforeEach(async ({ page }) => {
    // Criar uma página HTML de teste com os elementos necessários
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Ativos Drag Test</title>
      <style>
        .ativos_main-list {
          min-height: 200px;
          border: 2px solid #ccc;
          margin: 10px;
          padding: 10px;
        }
        .drop_ativos_area-wrapper {
          min-height: 150px;
          border: 2px dashed #999;
          margin: 10px;
          padding: 10px;
          background-color: #f0f0f0;
        }
        .ativos_main_drop_area {
          min-height: 200px;
          border: 2px solid #007bff;
          margin: 10px;
          padding: 10px;
          background-color: #e7f3ff;
        }
        .w-dyn-item {
          padding: 10px;
          margin: 5px;
          background-color: #fff;
          border: 1px solid #ddd;
          cursor: move;
        }
        .ativos_counter {
          font-weight: bold;
          margin: 10px;
        }
      </style>
    </head>
    <body>
      <h1>Teste Drag and Drop Ativos</h1>
      
      <div class="ativos_counter">Contador: 0</div>
      
      <div class="ativos_main-list">
        <h3>Lista de Origem</h3>
        <div class="w-dyn-item" data-item="1">Item 1 - Teste</div>
        <div class="w-dyn-item" data-item="2">Item 2 - Exemplo</div>
        <div class="w-dyn-item" data-item="3">Item 3 - Demo</div>
      </div>
      
      <div class="drop_ativos_area-wrapper">
        <h3>Área de Drop Intermediária</h3>
        <p>Arraste itens aqui</p>
      </div>
      
      <div class="ativos_main_drop_area">
        <h3>Área de Drop Final</h3>
        <p>Itens aparecerão aqui</p>
      </div>

      <script src="https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js"></script>
      <script type="module">
        // Simular o carregamento do módulo ativos
        import('./src/index.js').then(module => {
          console.log('Módulo carregado:', module);
        }).catch(err => {
          console.error('Erro ao carregar módulo:', err);
          
          // Implementação básica para teste
          window.testDragDrop = function() {
            console.log('Iniciando sistema de drag and drop...');
            
            // Configurar sortable na lista de origem
            const sourceList = document.querySelector('.ativos_main-list');
            if (sourceList) {
              new Sortable(sourceList, {
                group: {
                  name: 'ativos',
                  pull: 'clone',
                  put: false
                },
                sort: false,
                onEnd: function(evt) {
                  const isValidDrop = evt.to && (
                    evt.to.matches('.ativos_main_drop_area') || 
                    evt.to.matches('.drop_ativos_area-wrapper')
                  );
                  
                  if (isValidDrop && evt.item) {
                    console.log('Drop válido detectado');
                    evt.item.style.display = 'none';
                    evt.item.setAttribute('data-original-hidden', 'true');
                    
                    // Se foi dropado na área intermediária, mover para a área final
                    if (evt.to.matches('.drop_ativos_area-wrapper')) {
                      setTimeout(() => {
                        const mainDropArea = document.querySelector('.ativos_main_drop_area');
                        if (mainDropArea && evt.clone) {
                          mainDropArea.appendChild(evt.clone);
                        }
                      }, 100);
                    }
                    
                    // Atualizar contador
                    setTimeout(() => {
                      const dropAreaItems = document.querySelectorAll('.ativos_main_drop_area .w-dyn-item');
                      const counter = document.querySelector('.ativos_counter');
                      if (counter) {
                        counter.textContent = 'Contador: ' + dropAreaItems.length;
                      }
                    }, 200);
                  } else if (evt.clone) {
                    evt.clone.remove();
                  }
                }
              });
            }
            
            // Configurar área de drop intermediária
            const dropWrapper = document.querySelector('.drop_ativos_area-wrapper');
            if (dropWrapper) {
              new Sortable(dropWrapper, {
                group: {
                  name: 'ativos',
                  pull: false,
                  put: true
                },
                onAdd: function(evt) {
                  // Mover para área final
                  setTimeout(() => {
                    const mainDropArea = document.querySelector('.ativos_main_drop_area');
                    if (mainDropArea && evt.item) {
                      mainDropArea.appendChild(evt.item);
                      
                      // Atualizar contador
                      const dropAreaItems = document.querySelectorAll('.ativos_main_drop_area .w-dyn-item');
                      const counter = document.querySelector('.ativos_counter');
                      if (counter) {
                        counter.textContent = 'Contador: ' + dropAreaItems.length;
                      }
                    }
                  }, 0);
                }
              });
            }
            
            // Configurar área de drop final
            const mainDropArea = document.querySelector('.ativos_main_drop_area');
            if (mainDropArea) {
              new Sortable(mainDropArea, {
                group: {
                  name: 'ativos',
                  pull: false,
                  put: true
                }
              });
            }
            
            console.log('Sistema de drag and drop configurado');
          };
          
          // Inicializar após carregamento
          document.addEventListener('DOMContentLoaded', () => {
            setTimeout(window.testDragDrop, 100);
          });
          
          if (document.readyState === 'complete') {
            setTimeout(window.testDragDrop, 100);
          }
        });
      </script>
    </body>
    </html>
    `;

    // Navegar para a página HTML criada
    await page.setContent(htmlContent);
    await page.waitForTimeout(1000);
  });

  test('should debug drag and drop functionality', async ({ page }) => {
    // Executar o sistema de drag and drop
    await page.evaluate(() => {
      if (typeof window.testDragDrop === 'function') {
        window.testDragDrop();
      }
    });

    await page.waitForTimeout(500);

    // Verificar elementos iniciais
    const initialState = await page.evaluate(() => {
      return {
        sourceItems: document.querySelectorAll('.ativos_main-list .w-dyn-item').length,
        dropAreaItems: document.querySelectorAll('.ativos_main_drop_area .w-dyn-item').length,
        hasSortable: typeof window.Sortable !== 'undefined',
        counterText: document.querySelector('.ativos_counter')?.textContent,
      };
    });

    console.error('Initial state:', initialState);

    // Localizar primeiro item e área de drop
    const sourceItem = page.locator('.ativos_main-list .w-dyn-item').first();
    const dropArea = page.locator('.drop_ativos_area-wrapper');

    await expect(sourceItem).toBeVisible();
    await expect(dropArea).toBeVisible();

    // Capturar texto do item antes do drag
    const itemText = await sourceItem.textContent();

    // Realizar drag and drop
    await sourceItem.dragTo(dropArea);

    // Aguardar processamento
    await page.waitForTimeout(1000);

    // Verificar resultado
    const finalState = await page.evaluate(() => {
      const sourceItems = document.querySelectorAll('.ativos_main-list .w-dyn-item');
      const dropAreaItems = document.querySelectorAll('.ativos_main_drop_area .w-dyn-item');

      return {
        sourceItemsCount: sourceItems.length,
        dropAreaItemsCount: dropAreaItems.length,
        firstItemHidden: sourceItems[0]
          ? sourceItems[0].style.display === 'none' ||
            sourceItems[0].hasAttribute('data-original-hidden')
          : false,
        counterText: document.querySelector('.ativos_counter')?.textContent,
        dropAreaItemTexts: Array.from(dropAreaItems).map((item) => item.textContent?.trim()),
      };
    });

    console.error('Final state:', finalState);
    console.error('Original item text:', itemText);

    // Verificações
    expect(finalState.firstItemHidden).toBe(true);
    expect(finalState.dropAreaItemsCount).toBeGreaterThan(0);
    expect(finalState.dropAreaItemTexts).toContain(itemText?.trim());
  });

  test('should test multiple drags', async ({ page }) => {
    // Configurar drag and drop
    await page.evaluate(() => {
      if (typeof window.testDragDrop === 'function') {
        window.testDragDrop();
      }
    });

    await page.waitForTimeout(500);

    // Arrastar primeiro item
    const firstItem = page.locator('.ativos_main-list .w-dyn-item').first();
    const dropArea = page.locator('.drop_ativos_area-wrapper');

    await firstItem.dragTo(dropArea);
    await page.waitForTimeout(1000);

    // Arrastar segundo item
    const secondItem = page.locator('.ativos_main-list .w-dyn-item').nth(1);
    await secondItem.dragTo(dropArea);
    await page.waitForTimeout(1000);

    // Verificar resultado final
    const result = await page.evaluate(() => {
      const hiddenItems = Array.from(
        document.querySelectorAll('.ativos_main-list .w-dyn-item')
      ).filter(
        (item) => item.style.display === 'none' || item.hasAttribute('data-original-hidden')
      );

      const dropAreaItems = document.querySelectorAll('.ativos_main_drop_area .w-dyn-item');

      return {
        hiddenItemsCount: hiddenItems.length,
        dropAreaItemsCount: dropAreaItems.length,
        counterText: document.querySelector('.ativos_counter')?.textContent,
      };
    });

    console.error('Multiple drags result:', result);

    expect(result.hiddenItemsCount).toBe(2);
    expect(result.dropAreaItemsCount).toBe(2);
    expect(result.counterText).toBe('Contador: 2');
  });
});
