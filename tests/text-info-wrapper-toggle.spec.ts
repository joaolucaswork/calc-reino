import { expect, test } from '@playwright/test';

test.describe('Text Info Wrapper Toggle', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the test page with ativos functionality
    await page.goto('/test-ativos'); // Ajuste a URL conforme necessário
  });

  test('should show text-info_wrapper when drop area is empty', async ({ page }) => {
    // Ensure the drop area is empty
    const dropArea = page.locator('.ativos_main_drop_area');
    const textInfoWrapper = page.locator('.text-info_wrapper');

    // Clear any existing items in drop area
    const existingItems = dropArea.locator('.w-dyn-item, [data-ativo-item]');
    const itemCount = await existingItems.count();

    if (itemCount > 0) {
      // Move items back to source container if any exist
      for (let i = 0; i < itemCount; i++) {
        const item = existingItems.nth(i);
        await item.dragTo(page.locator('.ativos_main-list').first());
      }
    }

    // Wait for state update
    await page.waitForTimeout(200);

    // Verify text-info_wrapper is visible (does not have 'hide' class)
    await expect(textInfoWrapper).not.toHaveClass(/hide/);
    await expect(textInfoWrapper).toBeVisible();
  });

  test('should hide text-info_wrapper when drop area has items', async ({ page }) => {
    const sourceContainer = page.locator('.ativos_main-list');
    const dropArea = page.locator('.ativos_main_drop_area');
    const textInfoWrapper = page.locator('.text-info_wrapper');

    // Get first draggable item from source
    const firstItem = sourceContainer.locator('.w-dyn-item, [data-ativo-item]').first();

    // Ensure we have an item to drag
    await expect(firstItem).toBeVisible();

    // Drag item to drop area
    await firstItem.dragTo(dropArea);

    // Wait for state update
    await page.waitForTimeout(200);

    // Verify text-info_wrapper is hidden (has 'hide' class)
    await expect(textInfoWrapper).toHaveClass(/hide/);
    await expect(textInfoWrapper).toBeHidden();
  });

  test('should toggle visibility when items are added and removed', async ({ page }) => {
    const sourceContainer = page.locator('.ativos_main-list');
    const dropArea = page.locator('.ativos_main_drop_area');
    const textInfoWrapper = page.locator('.text-info_wrapper');
    const firstItem = sourceContainer.locator('.w-dyn-item, [data-ativo-item]').first();

    // Initially, drop area should be empty and text-info_wrapper visible
    await expect(textInfoWrapper).not.toHaveClass(/hide/);
    await expect(textInfoWrapper).toBeVisible();

    // Add item to drop area
    await firstItem.dragTo(dropArea);
    await page.waitForTimeout(200);

    // text-info_wrapper should be hidden
    await expect(textInfoWrapper).toHaveClass(/hide/);
    await expect(textInfoWrapper).toBeHidden();

    // Remove item back to source
    const droppedItem = dropArea.locator('.w-dyn-item, [data-ativo-item]').first();
    await droppedItem.dragTo(sourceContainer);
    await page.waitForTimeout(200);

    // text-info_wrapper should be visible again
    await expect(textInfoWrapper).not.toHaveClass(/hide/);
    await expect(textInfoWrapper).toBeVisible();
  });

  test('should work with multiple containers', async ({ page }) => {
    const sourceContainers = page.locator('.ativos_main-list');
    const textInfoWrappers = page.locator('.text-info_wrapper');

    // Test each container/drop area pair
    const containerCount = await sourceContainers.count();
    const textInfoCount = await textInfoWrappers.count();

    // Verify each text-info_wrapper responds to its associated container state
    for (let i = 0; i < Math.min(containerCount, textInfoCount); i++) {
      const container = sourceContainers.nth(i);
      const textInfo = textInfoWrappers.nth(i);

      // Check if container has items
      const items = container.locator('.w-dyn-item, [data-ativo-item]');
      const itemCount = await items.count();

      if (itemCount > 0) {
        // Container has items, text-info should be hidden
        await expect(textInfo).toHaveClass(/hide/);
      } else {
        // Container is empty, text-info should be visible
        await expect(textInfo).not.toHaveClass(/hide/);
      }
    }
  });

  test('should handle clean button functionality', async ({ page }) => {
    const cleanButton = page.locator('.ativos_clean-button');
    const sourceContainer = page.locator('.ativos_main-list');
    const dropArea = page.locator('.ativos_main_drop_area');
    const textInfoWrapper = page.locator('.text-info_wrapper');

    // Add item to drop area first
    const firstItem = sourceContainer.locator('.w-dyn-item, [data-ativo-item]').first();
    await firstItem.dragTo(dropArea);
    await page.waitForTimeout(200);

    // Verify text-info_wrapper is hidden
    await expect(textInfoWrapper).toHaveClass(/hide/);

    // Click clean button to restore all items
    await cleanButton.click();
    await page.waitForTimeout(500); // Clean operation may take longer

    // Verify text-info_wrapper is visible again (drop area should be empty)
    await expect(textInfoWrapper).not.toHaveClass(/hide/);
    await expect(textInfoWrapper).toBeVisible();
  });
});
