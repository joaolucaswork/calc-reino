import { expect, test } from '@playwright/test';

interface StoredDropAreaItem {
  id: string;
  name: string;
  type: 'original' | 'custom';
  position: number;
  createdAt: string;
  originalId?: string;
}

test.describe('Ativos Drag and Drop', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar para a página com os ativos
    await page.goto('https://www.reinocapital.com.br/experiencia-interativa'); // Ajuste a URL conforme necessário

    // Aguardar até que os elementos essenciais estejam carregados
    await page.waitForSelector('.ativos_main-list');
    await page.waitForSelector('.drop_ativos_area-wrapper');
    await page.waitForSelector('.ativos_main_drop_area');

    // Aguardar até que o JavaScript seja carregado
    await page.waitForTimeout(1000);
  });

  test('should hide source item and show in drop area when dragged', async ({ page }) => {
    // Localizar o primeiro item na lista de origem
    const sourceItem = page.locator('.ativos_main-list .w-dyn-item').first();
    await expect(sourceItem).toBeVisible();

    // Capturar o texto do item para verificar depois
    const itemText = await sourceItem.textContent();

    // Localizar a área de drop
    const dropArea = page.locator('.drop_ativos_area-wrapper');
    await expect(dropArea).toBeVisible();

    // Realizar drag and drop
    await sourceItem.dragTo(dropArea);

    // Aguardar um pouco para as animações
    await page.waitForTimeout(1000);

    // Verificar se o item original foi escondido
    const isSourceItemHidden = await sourceItem.evaluate((el) => {
      return el.style.display === 'none' || el.hasAttribute('data-original-hidden');
    });

    // Verificar se o item apareceu na área de drop principal
    const mainDropArea = page.locator('.ativos_main_drop_area');
    const droppedItems = mainDropArea.locator('.w-dyn-item');
    const droppedItemsCount = await droppedItems.count();

    // Verificar se existe um item com o mesmo texto
    if (droppedItemsCount > 0) {
      const droppedItem = droppedItems.first();
      const droppedItemText = await droppedItem.textContent();
      console.log('Dropped item text:', droppedItemText);
      expect(droppedItemText).toContain(itemText?.trim() || '');
    }

    // Verificações finais
    expect(isSourceItemHidden).toBe(true);
    expect(droppedItemsCount).toBeGreaterThan(0);
  });

  test('should not hide source item when dragged to invalid area', async ({ page }) => {
    // Localizar o primeiro item na lista de origem
    const sourceItem = page.locator('.ativos_main-list .w-dyn-item').first();
    await expect(sourceItem).toBeVisible();

    // Localizar uma área inválida (por exemplo, o header)
    const invalidArea = page.locator('body').first();

    // Realizar drag para área inválida
    console.log('Dragging to invalid area...');
    await sourceItem.dragTo(invalidArea);

    // Aguardar um pouco
    await page.waitForTimeout(500);

    // Verificar se o item original ainda está visível
    console.log('Checking if source item is still visible...');
    const isSourceItemVisible = await sourceItem.evaluate((el) => {
      return el.style.display !== 'none' && !el.hasAttribute('data-original-hidden');
    });
    console.log('Source item visible:', isSourceItemVisible);

    expect(isSourceItemVisible).toBe(true);
  });

  test('should update counter when item is moved', async ({ page }) => {
    // Localizar contador antes do drag
    const counter = page.locator('.ativos_counter');
    const initialCount = await counter.textContent();
    console.log('Initial counter:', initialCount);

    // Localizar item e área de drop
    const sourceItem = page.locator('.ativos_main-list .w-dyn-item').first();
    const dropArea = page.locator('.drop_ativos_area-wrapper');

    // Realizar drag and drop
    console.log('Performing drag and drop...');
    await sourceItem.dragTo(dropArea);

    // Aguardar atualização do contador
    await page.waitForTimeout(1000);

    // Verificar se contador foi atualizado
    const finalCount = await counter.textContent();
    console.log('Final counter:', finalCount);

    expect(finalCount).not.toBe(initialCount);
  });

  test('should debug sortable instances and events', async ({ page }) => {
    // Executar JavaScript no contexto da página para debuggar
    const debugInfo = await page.evaluate(() => {
      // Verificar se o módulo foi carregado
      const hasAtivosManager = typeof window.ativosUtils !== 'undefined';

      // Verificar elementos no DOM
      const sourceContainers = document.querySelectorAll('.ativos_main-list');
      const dropAreas = document.querySelectorAll('.drop_ativos_area-wrapper');
      const mainDropAreas = document.querySelectorAll('.ativos_main_drop_area');
      const sourceItems = document.querySelectorAll('.ativos_main-list .w-dyn-item');

      return {
        hasAtivosManager,
        sourceContainersCount: sourceContainers.length,
        dropAreasCount: dropAreas.length,
        mainDropAreasCount: mainDropAreas.length,
        sourceItemsCount: sourceItems.length,
        firstItemHTML: sourceItems[0]?.outerHTML.substring(0, 200),
      };
    });

    console.log('Debug info:', debugInfo);

    // Verificar se os elementos essenciais existem
    expect(debugInfo.sourceContainersCount).toBeGreaterThan(0);
    expect(debugInfo.dropAreasCount).toBeGreaterThan(0);
    expect(debugInfo.mainDropAreasCount).toBeGreaterThan(0);
    expect(debugInfo.sourceItemsCount).toBeGreaterThan(0);
  });

  test('should persist original items in localStorage after drag', async ({ page }) => {
    // Localizar item original
    const sourceItem = page.locator('.ativos_main-list .w-dyn-item').first();
    const itemText = await sourceItem.textContent();

    // Arrastar para drop area
    const dropArea = page.locator('.drop_ativos_area-wrapper');
    await sourceItem.dragTo(dropArea);
    await page.waitForTimeout(1000);

    // Verificar se foi salvo no localStorage
    const storedItems = (await page.evaluate(() => {
      const stored = localStorage.getItem('ativos_drop_area_items');
      return stored ? JSON.parse(stored) : [];
    })) as StoredDropAreaItem[];

    expect(storedItems.length).toBeGreaterThan(0);
    expect(
      storedItems.some((item: StoredDropAreaItem) => item.name.includes(itemText?.trim() || ''))
    ).toBe(true);
    expect(storedItems.some((item: StoredDropAreaItem) => item.type === 'original')).toBe(true);
  });

  test('should restore original items after page reload', async ({ page }) => {
    // Primeiro, arrastar um item
    const sourceItem = page.locator('.ativos_main-list .w-dyn-item').first();
    const itemText = await sourceItem.textContent();
    const dropArea = page.locator('.drop_ativos_area-wrapper');

    await sourceItem.dragTo(dropArea);
    await page.waitForTimeout(1000);

    // Recarregar página
    await page.reload();
    await page.waitForTimeout(2000);

    // Verificar se item foi restaurado na drop area
    const dropAreaItems = page.locator('.ativos_main_drop_area .w-dyn-item');
    const dropAreaCount = await dropAreaItems.count();

    expect(dropAreaCount).toBeGreaterThan(0);

    if (dropAreaCount > 0) {
      const restoredItemText = await dropAreaItems.first().textContent();
      expect(restoredItemText).toContain(itemText?.trim() || '');
    }
  });
});
