package com.example.sm2mod;

import com.mojang.blaze3d.vertex.PoseStack;
import com.mojang.math.Axis;

import net.minecraft.client.renderer.MultiBufferSource;
import net.minecraft.client.renderer.entity.EntityRenderer;
import net.minecraft.client.renderer.entity.EntityRendererProvider;
import net.minecraft.client.renderer.entity.ItemRenderer;
import net.minecraft.client.renderer.texture.OverlayTexture;
import net.minecraft.client.renderer.texture.TextureAtlas;
import net.minecraft.resources.ResourceLocation;
import net.minecraft.world.item.ItemDisplayContext;

/** Renders the thrown grenade as its real 3D item model, tumbling in flight. */
public class GrenadeRenderer extends EntityRenderer<GrenadeEntity> {
    private final ItemRenderer itemRenderer;

    public GrenadeRenderer(EntityRendererProvider.Context context) {
        super(context);
        this.itemRenderer = context.getItemRenderer();
        this.shadowRadius = 0.1F;
    }

    @Override
    public void render(GrenadeEntity entity, float yaw, float partialTick, PoseStack poseStack, MultiBufferSource buffer, int light) {
        poseStack.pushPose();
        poseStack.translate(0.0D, 0.15D, 0.0D);
        float t = entity.tickCount + partialTick;
        poseStack.mulPose(Axis.YP.rotationDegrees(t * 25.0F));
        poseStack.mulPose(Axis.XP.rotationDegrees(t * 35.0F));
        poseStack.scale(1.1F, 1.1F, 1.1F);
        itemRenderer.renderStatic(entity.getItem(), ItemDisplayContext.FIXED, light, OverlayTexture.NO_OVERLAY,
                poseStack, buffer, entity.level(), entity.getId());
        poseStack.popPose();
        super.render(entity, yaw, partialTick, poseStack, buffer, light);
    }

    @Override
    public ResourceLocation getTextureLocation(GrenadeEntity entity) {
        return TextureAtlas.LOCATION_BLOCKS;
    }
}
